import axios from 'axios';

// Wandbox API — free, no auth required, reliable public instance
// https://wandbox.org/
const WANDBOX_API_URL = process.env.WANDBOX_API_URL || 'https://wandbox.org/api';

// Wandbox compiler config per language
const languageConfig = {
  c:          { compiler: 'gcc-head',        options: '-O2 -lm' },
  cpp:        { compiler: 'g++-head',        options: '-O2 -std=c++17' },
  python:     { compiler: 'cpython-3.12.3',  options: '' },
  javascript: { compiler: 'nodejs-20.11.0',  options: '' },
  java:       { compiler: 'openjdk-22',      options: '' },
};

/**
 * Execute code against a single test case using Wandbox API
 */
const executeTestCase = async (code, language, input, timeLimit = 3000) => {
  const lang = languageConfig[language];

  if (!lang) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const response = await axios.post(
      `${WANDBOX_API_URL}/compile.json`,
      {
        compiler: lang.compiler,
        code,
        stdin: input || '',
        'compiler-option-raw': lang.options,
      },
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return { status: '-1', signal: 'SIGKILL', program_output: '', program_error: 'Time limit exceeded', compiler_error: '' };
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
 * Determine verdict based on Wandbox API response
 */
const getVerdict = (wandboxResult, expectedOutput) => {
  // Compilation error
  if (wandboxResult.compiler_error) {
    return {
      verdict: 'COMPILATION_ERROR',
      error: wandboxResult.compiler_error,
    };
  }

  // Time limit exceeded
  if (wandboxResult.signal === 'SIGKILL' || wandboxResult.signal === 'SIGXCPU') {
    return { verdict: 'TIME_LIMIT_EXCEEDED', error: 'Time limit exceeded' };
  }

  // Runtime error (non-zero exit)
  const exitCode = parseInt(wandboxResult.status, 10);
  if (exitCode !== 0 && wandboxResult.program_error) {
    return {
      verdict: 'RUNTIME_ERROR',
      error: wandboxResult.program_error,
    };
  }

  // Compare output
  const actualOutput = normalizeOutput(wandboxResult.program_output);
  const expected = normalizeOutput(expectedOutput);

  if (actualOutput === expected) {
    return { verdict: 'PASSED', output: actualOutput };
  } else {
    return { verdict: 'WRONG_ANSWER', output: actualOutput, expected };
  }
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
      const wandboxResult = await executeTestCase(code, language, testCase.input, timeLimit);
      const testVerdict = getVerdict(wandboxResult, testCase.expectedOutput);

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
      const isApiError = statusCode === 429 || (statusCode >= 500);
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
    const response = await axios.get(`${WANDBOX_API_URL}/list.json`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch runtimes:', error.message);
    return [];
  }
};

export default { executeCode, getAvailableRuntimes };
