import axios from 'axios';

// Judge0 CE — free public API, no auth required
// Can be overridden via env var to use a self-hosted or RapidAPI instance
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';

// Judge0 language IDs
const languageConfig = {
  c:          50,  // C (GCC 9.2.0)
  cpp:        54,  // C++ (GCC 9.2.0)
  python:     71,  // Python (3.8.1)
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  java:       62,  // Java (OpenJDK 13.0.1)
};

// Judge0 status IDs
const JUDGE0_STATUS = {
  1: 'PENDING',               // In Queue
  2: 'PENDING',               // Processing
  3: 'ACCEPTED',              // Accepted (output match checked separately)
  4: 'WRONG_ANSWER',          // Wrong Answer
  5: 'TIME_LIMIT_EXCEEDED',
  6: 'COMPILATION_ERROR',
  7: 'RUNTIME_ERROR',         // SIGSEGV
  8: 'RUNTIME_ERROR',         // SIGXFSZ
  9: 'RUNTIME_ERROR',         // SIGFPE
  10: 'RUNTIME_ERROR',        // SIGABRT
  11: 'RUNTIME_ERROR',        // NZEC
  12: 'RUNTIME_ERROR',        // Other
  13: 'RUNTIME_ERROR',        // Internal Error
  14: 'RUNTIME_ERROR',        // Exec Format Error
};

/**
 * Execute code against a single test case using Judge0 CE API
 */
const executeTestCase = async (code, language, input, timeLimit = 3000) => {
  const languageId = languageConfig[language];

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const response = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input || '',
        cpu_time_limit: Math.max(1, timeLimit / 1000),  // seconds
        memory_limit: 262144,                            // 256 MB in KB
      },
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Simulate a TLE result so the verdict flow still works
      return { status: { id: 5, description: 'Time Limit Exceeded' } };
    }
    throw error;
  }
};

/**
 * Normalize output for comparison (trim whitespace, normalize line endings)
 */
const normalizeOutput = (output) => {
  if (!output) return '';
  return output
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
};

/**
 * Determine verdict based on Judge0 response
 */
const getVerdict = (judge0Result, expectedOutput) => {
  const statusId = judge0Result?.status?.id;

  if (statusId === 6) {
    return {
      verdict: 'COMPILATION_ERROR',
      error: judge0Result.compile_output || judge0Result.stderr || 'Compilation failed',
    };
  }

  if (statusId === 5) {
    return { verdict: 'TIME_LIMIT_EXCEEDED', error: 'Time limit exceeded' };
  }

  if (statusId >= 7 && statusId <= 14) {
    return {
      verdict: 'RUNTIME_ERROR',
      error: judge0Result.stderr || `Runtime error (status ${statusId})`,
    };
  }

  if (statusId === 3 || statusId === 4) {
    const actualOutput = normalizeOutput(judge0Result.stdout);
    const expected = normalizeOutput(expectedOutput);

    if (actualOutput === expected) {
      return { verdict: 'PASSED', output: actualOutput };
    } else {
      return { verdict: 'WRONG_ANSWER', output: actualOutput, expected };
    }
  }

  return {
    verdict: 'RUNTIME_ERROR',
    error: `Unexpected status from execution service: ${statusId}`,
  };
};

/**
 * Execute code against all test cases
 */
export const executeCode = async (code, language, testCases, timeLimit = 3000) => {
  const results = {
    verdict: 'PENDING',
    testCasesPassed: 0,
    totalTestCases: testCases.length,
    executionTime: 0,
    memoryUsed: 0,
    errorMessage: '',
    testCaseResults: []
  };

  const startTime = Date.now();
  let allPassed = true;
  let firstError = null;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    try {
      const judge0Result = await executeTestCase(code, language, testCase.input, timeLimit);
      const testVerdict = getVerdict(judge0Result, testCase.expectedOutput);

      const testResult = {
        testCaseIndex: i + 1,
        verdict: testVerdict.verdict,
        isHidden: testCase.isHidden
      };

      // Only include output details for visible test cases
      if (!testCase.isHidden) {
        testResult.input = testCase.input;
        testResult.expectedOutput = testCase.expectedOutput;
        testResult.actualOutput = testVerdict.output || '';
      }

      if (testVerdict.verdict === 'PASSED') {
        results.testCasesPassed++;
      } else {
        allPassed = false;
        if (!firstError) {
          firstError = {
            verdict: testVerdict.verdict,
            message: testVerdict.error || `Expected: ${testVerdict.expected}, Got: ${testVerdict.output}`
          };
        }
      }

      results.testCaseResults.push(testResult);

      // Stop on first compile error (no point continuing)
      if (testVerdict.verdict === 'COMPILATION_ERROR') {
        results.verdict = 'COMPILATION_ERROR';
        results.errorMessage = testVerdict.error;
        break;
      }

    } catch (error) {
      const statusCode = error?.response?.status;
      const isApiError = statusCode === 401 || statusCode === 403 || statusCode === 429 || (statusCode >= 500);
      const errMsg = isApiError
        ? `Code execution service unavailable (HTTP ${statusCode}). Please try again later.`
        : 'Failed to execute test case';

      console.error(`Error executing test case ${i + 1}:`, error.message);
      results.testCaseResults.push({
        testCaseIndex: i + 1,
        verdict: 'RUNTIME_ERROR',
        isHidden: testCase.isHidden
      });
      allPassed = false;
      if (!firstError) {
        firstError = {
          verdict: 'RUNTIME_ERROR',
          message: errMsg
        };
      }

      // If the execution API itself is failing (not a user code error), stop immediately
      if (isApiError) {
        results.verdict = 'RUNTIME_ERROR';
        results.errorMessage = errMsg;
        break;
      }
    }

    // Delay between test cases to respect Judge0 rate limits
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  results.executionTime = Date.now() - startTime;

  // Determine final verdict
  if (results.verdict !== 'COMPILATION_ERROR') {
    if (allPassed) {
      results.verdict = 'ACCEPTED';
    } else if (firstError) {
      results.verdict = firstError.verdict === 'PASSED' ? 'WRONG_ANSWER' : firstError.verdict;
      results.errorMessage = firstError.message;
    } else {
      results.verdict = 'WRONG_ANSWER';
    }
  }

  return results;
};

/**
 * Get available Judge0 languages (for debugging/info)
 */
export const getAvailableRuntimes = async () => {
  try {
    const response = await axios.get(`${JUDGE0_API_URL}/languages`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch languages:', error.message);
    return [];
  }
};

export default { executeCode, getAvailableRuntimes };
