import axios from 'axios';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

// Language configurations for Piston
const languageConfig = {
  c: {
    language: 'c',
    version: '10.2.0',
    filename: 'main.c'
  },
  cpp: {
    language: 'cpp',
    version: '10.2.0',
    filename: 'main.cpp'
  },
  python: {
    language: 'python',
    version: '3.10.0',
    filename: 'main.py'
  },
  javascript: {
    language: 'javascript',
    version: '18.15.0',
    filename: 'main.js'
  },
  java: {
    language: 'java',
    version: '15.0.2',
    filename: 'Main.java'
  }
};

/**
 * Execute code against a single test case using Piston API
 */
const executeTestCase = async (code, language, input, timeLimit = 3000) => {
  const config = languageConfig[language];
  
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const response = await axios.post(PISTON_API_URL, {
      language: config.language,
      version: config.version,
      files: [
        {
          name: config.filename,
          content: code
        }
      ],
      stdin: input || '',
      compile_timeout: 10000,
      run_timeout: timeLimit,
      compile_memory_limit: -1,
      run_memory_limit: -1
    }, {
      timeout: 30000 // 30 second axios timeout
    });

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        compile: { code: 0, stderr: '', stdout: '' },
        run: { 
          code: -1, 
          signal: 'SIGKILL', 
          stderr: 'Execution timed out', 
          stdout: '' 
        }
      };
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
    .replace(/\r\n/g, '\n')  // Normalize Windows line endings
    .replace(/\r/g, '\n')     // Normalize old Mac line endings
    .trim();                   // Remove leading/trailing whitespace
};

/**
 * Determine verdict based on Piston response
 */
const getVerdict = (pistonResult, expectedOutput) => {
  const { compile, run } = pistonResult;

  // Check for compilation error
  if (compile && compile.code !== 0) {
    return {
      verdict: 'COMPILATION_ERROR',
      error: compile.stderr || compile.stdout || 'Compilation failed'
    };
  }

  // Check for timeout (SIGKILL usually means timeout)
  if (run.signal === 'SIGKILL') {
    return {
      verdict: 'TIME_LIMIT_EXCEEDED',
      error: 'Program execution timed out'
    };
  }

  // Check for runtime error
  if (run.code !== 0 && run.code !== null) {
    return {
      verdict: 'RUNTIME_ERROR',
      error: run.stderr || `Program exited with code ${run.code}`
    };
  }

  // Compare output
  const actualOutput = normalizeOutput(run.stdout);
  const expected = normalizeOutput(expectedOutput);

  if (actualOutput === expected) {
    return {
      verdict: 'PASSED',
      output: actualOutput
    };
  } else {
    return {
      verdict: 'WRONG_ANSWER',
      output: actualOutput,
      expected: expected
    };
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
      const pistonResult = await executeTestCase(code, language, testCase.input, timeLimit);
      const testVerdict = getVerdict(pistonResult, testCase.expectedOutput);

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
      console.error(`Error executing test case ${i + 1}:`, error.message);
      results.testCaseResults.push({
        testCaseIndex: i + 1,
        verdict: 'SYSTEM_ERROR',
        isHidden: testCase.isHidden
      });
      allPassed = false;
      if (!firstError) {
        firstError = {
          verdict: 'SYSTEM_ERROR',
          message: 'Failed to execute test case'
        };
      }
    }

    // Small delay between test cases to avoid rate limiting
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
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
 * Get available Piston runtimes (for debugging/info)
 */
export const getAvailableRuntimes = async () => {
  try {
    const response = await axios.get('https://emkc.org/api/v2/piston/runtimes');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch runtimes:', error.message);
    return [];
  }
};

export default { executeCode, getAvailableRuntimes };
