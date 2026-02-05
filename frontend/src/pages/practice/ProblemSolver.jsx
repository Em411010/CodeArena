import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { sampleProblemsAPI, submissionsAPI } from '../../services/api';
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MemoryStick,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const languageMap = {
  c: 'c',
};

const defaultCode = {
  c: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n#include <ctype.h>\n\nint main() {\n    // Your code here\n    \n    return 0;\n}\n',
};

const ProblemSolver = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState(defaultCode.c);
  const [result, setResult] = useState(null);
  const [showDescription, setShowDescription] = useState(true);

  useEffect(() => {
    fetchProblem();
  }, [id]);

  const fetchProblem = async () => {
    try {
      const { data } = await sampleProblemsAPI.getById(id);
      setProblem(data.data);
      if (data.data.allowedLanguages?.length > 0) {
        const firstLang = data.data.allowedLanguages[0];
        setLanguage(firstLang);
        setCode(defaultCode[firstLang] || '');
      }
    } catch (error) {
      toast.error('Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(defaultCode[newLang] || '');
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const { data } = await submissionsAPI.submit({
        problemId: id,
        problemType: 'SampleProblem',
        language,
        code,
      });

      setResult(data.data);
      
      if (data.data.verdict === 'ACCEPTED') {
        toast.success('All test cases passed! 🎉');
      } else {
        toast.error(`Verdict: ${data.data.verdict.replace('_', ' ')}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Problem not found</p>
        <Link to="/practice" className="text-primary-500 hover:underline mt-2 inline-block">
          Back to problems
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/practice"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{problem.title}</h1>
            <span className={`text-sm capitalize ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-arena-card border border-arena-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {problem.allowedLanguages?.map((lang) => (
              <option key={lang} value={lang} className="capitalize">
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Problem Description */}
        <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden flex flex-col">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center justify-between px-4 py-3 bg-arena-dark border-b border-arena-border lg:hidden"
          >
            <span className="text-white font-medium">Problem Description</span>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showDescription ? 'rotate-180' : ''}`} />
          </button>
          <div className={`flex-1 overflow-y-auto p-4 ${!showDescription ? 'hidden lg:block' : ''}`}>
            <div className="prose prose-invert max-w-none">
              <h3 className="text-white text-lg font-medium mb-3">Description</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{problem.description}</p>

              {problem.constraints && (
                <>
                  <h3 className="text-white text-lg font-medium mt-6 mb-3">Constraints</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{problem.constraints}</p>
                </>
              )}

              {problem.inputFormat && (
                <>
                  <h3 className="text-white text-lg font-medium mt-6 mb-3">Input Format</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{problem.inputFormat}</p>
                </>
              )}

              {problem.outputFormat && (
                <>
                  <h3 className="text-white text-lg font-medium mt-6 mb-3">Output Format</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{problem.outputFormat}</p>
                </>
              )}

              {problem.sampleInput && (
                <>
                  <h3 className="text-white text-lg font-medium mt-6 mb-3">Sample Input</h3>
                  <pre className="bg-arena-dark p-3 rounded-lg text-gray-300 overflow-x-auto">
                    {problem.sampleInput}
                  </pre>
                </>
              )}

              {problem.sampleOutput && (
                <>
                  <h3 className="text-white text-lg font-medium mt-6 mb-3">Sample Output</h3>
                  <pre className="bg-arena-dark p-3 rounded-lg text-gray-300 overflow-x-auto">
                    {problem.sampleOutput}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Code Editor & Result */}
        <div className="flex flex-col min-h-0">
          {/* Editor */}
          <div className="flex-1 bg-arena-card border border-arena-border rounded-xl overflow-hidden min-h-[300px]">
            <Editor
              height="100%"
              language={languageMap[language]}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>

          {/* Result */}
          {result && (
            <div className="mt-4 bg-arena-card border border-arena-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {result.verdict === 'ACCEPTED' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <span className={`font-medium ${
                    result.verdict === 'ACCEPTED' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.verdict.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {result.testCasesPassed}/{result.totalTestCases} test cases passed
                </span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{result.executionTime}ms</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MemoryStick className="h-4 w-4" />
                  <span>{(result.memoryUsed / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              {result.errorMessage && (
                <pre className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm overflow-x-auto">
                  {result.errorMessage}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemSolver;
