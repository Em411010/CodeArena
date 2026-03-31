import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { lobbiesAPI, competitionProblemsAPI } from '../../services/api';
import { ArrowLeft, Loader2, Save, Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };
const LANGUAGES = ['c', 'cpp', 'python', 'javascript', 'java'];

const CreateLobby = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    matchType: 'STANDARD',
    timePerProblem: 5,
    problems: [],
    settings: {
      maxParticipants: 100,
      allowLateJoin: false,
      showLeaderboard: true,
      matchLanguage: '',
    },
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const { data } = await competitionProblemsAPI.getAll();
      setProblems(data.data);
    } catch (error) {
      toast.error('Failed to load problems');
    } finally {
      setLoadingProblems(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Convert numeric fields to numbers
    const numericFields = ['duration', 'timePerProblem'];
    const finalValue = type === 'number' || numericFields.includes(name) 
      ? (value === '' ? '' : Number(value)) 
      : value;
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    } else {
      finalValue = value;
    }
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        [name]: finalValue,
      },
    });
  };

  const toggleProblem = (problemId) => {
    const current = formData.problems;
    if (current.includes(problemId)) {
      setFormData({ ...formData, problems: current.filter(id => id !== problemId) });
    } else {
      setFormData({ ...formData, problems: [...current, problemId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Lobby name is required');
      return;
    }

    if (formData.problems.length === 0) {
      toast.error('Select at least one problem');
      return;
    }

    // Auto-calculate duration for Quiz Bee mode
    const submissionData = { ...formData };
    if (formData.matchType === 'QUIZ_BEE') {
      submissionData.duration = formData.timePerProblem * formData.problems.length;
    }

    setLoading(true);

    try {
      const { data } = await lobbiesAPI.create(submissionData);
      toast.success(`Lobby created! Access code: ${data.data.accessCode}`);
      navigate(`/teacher/lobbies/${data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create lobby');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const sortedFilteredProblems = useMemo(() => {
    const effectiveLang = filterLanguage || formData.settings.matchLanguage;
    return problems
      .filter(p => {
        const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
        const matchesDiff = !filterDifficulty || p.difficulty === filterDifficulty;
        const matchesLang = !effectiveLang || p.allowedLanguages?.includes(effectiveLang);
        return matchesSearch && matchesDiff && matchesLang;
      })
      .sort((a, b) => {
        const diffDiff = (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99);
        if (diffDiff !== 0) return diffDiff;
        return a.title.localeCompare(b.title);
      });
  }, [problems, search, filterDifficulty, filterLanguage, formData.settings.matchLanguage]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/teacher/lobbies')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Lobby</h1>
          <p className="text-gray-400">Set up a new competition lobby</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-arena-card border border-arena-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Lobby Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Weekly Coding Challenge"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="A fun coding challenge for the class..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.matchType === 'STANDARD' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                  <input
                    name="duration"
                    type="number"
                    value={formData.duration}
                    onChange={handleChange}
                    min={5}
                    max={480}
                    className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Participants</label>
                <input
                  name="maxParticipants"
                  type="number"
                  value={formData.settings.maxParticipants}
                  onChange={handleSettingChange}
                  min={2}
                  max={1000}
                  className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Match Type</label>
                <select
                  name="matchType"
                  value={formData.matchType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="STANDARD">Standard - Free Navigation</option>
                  <option value="QUIZ_BEE">Quiz Bee - Synchronized</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.matchType === 'STANDARD' 
                    ? 'Students can solve problems in any order'
                    : 'All students see the same problem and move together'}
                </p>
              </div>
              {formData.matchType === 'QUIZ_BEE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time Per Problem (minutes)</label>
                  <input
                    name="timePerProblem"
                    type="number"
                    value={formData.timePerProblem}
                    onChange={handleChange}
                    min={1}
                    max={30}
                    className="w-full px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Total duration: {formData.timePerProblem * formData.problems.length} minutes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-arena-card border border-arena-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="showLeaderboard"
                checked={formData.settings.showLeaderboard}
                onChange={handleSettingChange}
                className="rounded border-arena-border bg-arena-dark text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-300">Show leaderboard to participants</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="allowLateJoin"
                checked={formData.settings.allowLateJoin}
                onChange={handleSettingChange}
                className="rounded border-arena-border bg-arena-dark text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-300">Allow late join after match starts</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Match Language Restriction</label>
              <select
                name="matchLanguage"
                value={formData.settings.matchLanguage}
                onChange={handleSettingChange}
                className="w-full md:w-64 px-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All languages allowed</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang.toUpperCase()} only</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {formData.settings.matchLanguage
                  ? `Participants will only be able to submit in ${formData.settings.matchLanguage.toUpperCase()}`
                  : 'Participants can use any language allowed by each problem'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-arena-card border border-arena-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Select Problems <span className="text-gray-400 font-normal">({formData.problems.length} selected)</span>
          </h2>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="w-full pl-9 pr-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 bg-arena-dark border border-arena-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={filterLanguage}
              onChange={e => setFilterLanguage(e.target.value)}
              className="px-3 py-2 bg-arena-dark border border-arena-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All languages</option>
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {loadingProblems ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : problems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No problems available</p>
              <p className="text-gray-500 text-sm mt-1">Create some problems first</p>
            </div>
          ) : sortedFilteredProblems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No problems match your filters</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {sortedFilteredProblems.map((problem) => (
                <div
                  key={problem._id}
                  onClick={() => toggleProblem(problem._id)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                    formData.problems.includes(problem._id)
                      ? 'bg-primary-600/20 border-2 border-primary-500'
                      : 'bg-arena-dark border-2 border-transparent hover:border-arena-border'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center ${
                      formData.problems.includes(problem._id) ? 'bg-primary-600' : 'bg-arena-border'
                    }`}>
                      {formData.problems.includes(problem._id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-white font-medium truncate">{problem.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    <div className="hidden sm:flex gap-1">
                      {(problem.allowedLanguages || []).map(lang => (
                        <span key={lang} className="px-1.5 py-0.5 rounded text-xs bg-arena-border text-gray-300 uppercase">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm flex-shrink-0 ml-2">{problem.maxScore} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/lobbies')}
            className="px-6 py-2 bg-arena-card text-gray-300 rounded-lg hover:bg-arena-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.problems.length === 0}
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
                Create Lobby
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLobby;
