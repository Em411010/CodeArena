import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { competitionProblemsAPI } from '../../services/api';
import { ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateProblem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    allowedLanguages: ['c'],
    constraints: '',
    inputFormat: '',
    outputFormat: '',
    sampleInput: '',
    sampleOutput: '',
    timeLimit: 2000,
    memoryLimit: 256,
    maxScore: 100,
    testCases: [{ input: '', expectedOutput: '', isHidden: false, points: 10 }],
    tags: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLanguageToggle = (lang) => {
    const current = formData.allowedLanguages;
    if (current.includes(lang)) {
      if (current.length > 1) {
        setFormData({ ...formData, allowedLanguages: current.filter(l => l !== lang) });
      }
    } else {
      setFormData({ ...formData, allowedLanguages: [...current, lang] });
    }
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData({ ...formData, testCases: newTestCases });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', expectedOutput: '', isHidden: true, points: 10 }],
    });
  };

  const removeTestCase = (index) => {
    if (formData.testCases.length > 1) {
      setFormData({
        ...formData,
        testCases: formData.testCases.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    if (formData.testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) {
      toast.error('All test cases must have input and expected output');
      return;
    }

    setLoading(true);

    try {
      await competitionProblemsAPI.create(formData);
      toast.success('Problem created successfully');
      navigate('/teacher/problems');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create problem');
    } finally {
      setLoading(false);
    }
  };

  const languages = ['c'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/teacher/problems')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Competition Problem</h1>
          <p className="text-gray-400">Create a new problem for competitions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-arena-card border border-arena-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Two Sum"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Given an array of integers..."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Score</label>
                <input
                  name="maxScore"
                  type="number"
                  value={formData.maxScore}
                  onChange={handleChange}
                  min={10}
                  max={1000}
                  className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (ms)</label>
                <input
                  name="timeLimit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={handleChange}
                  min={100}
                  max={10000}
                  className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-arena-card border border-arena-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Allowed Languages</h2>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageToggle(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.allowedLanguages.includes(lang)
                    ? 'bg-primary-600 text-white'
                    : 'bg-arena-dark text-gray-400 hover:bg-arena-border'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sample I/O */}
        <div className="bg-arena-card border border-arena-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Sample Input/Output</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sample Input</label>
              <textarea
                name="sampleInput"
                value={formData.sampleInput}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="[2, 7, 11, 15]&#10;9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sample Output</label>
              <textarea
                name="sampleOutput"
                value={formData.sampleOutput}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="[0, 1]"
              />
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="bg-arena-card border border-arena-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Test Cases</h2>
            <button
              type="button"
              onClick={addTestCase}
              className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Test Case
            </button>
          </div>
          <div className="space-y-4">
            {formData.testCases.map((tc, index) => (
              <div key={index} className="bg-arena-dark rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">Test Case {index + 1}</span>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => handleTestCaseChange(index, 'isHidden', e.target.checked)}
                        className="rounded border-arena-border bg-arena-card text-primary-600 focus:ring-primary-500"
                      />
                      <span>Hidden</span>
                    </label>
                    {formData.testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-arena-card border border-arena-border rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Expected Output</label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-arena-card border border-arena-border rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/problems')}
            className="px-6 py-2 bg-arena-card text-gray-300 rounded-lg hover:bg-arena-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Problem
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProblem;
