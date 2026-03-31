import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { competitionProblemsAPI } from '../../services/api';
import { FileCode, Plus, Loader2, Edit, Trash2, Lock, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LANGUAGES = ['c', 'cpp', 'python', 'javascript', 'java'];

const TeacherProblems = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [langFilter, setLangFilter] = useState('');
  const [search, setSearch] = useState('');

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
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;

    try {
      await competitionProblemsAPI.delete(id);
      setProblems(problems.filter(p => p._id !== id));
      toast.success('Problem deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete problem');
    }
  };

  const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };

  const filteredProblems = problems
    .filter(p => {
      const matchesLang = !langFilter || p.allowedLanguages?.includes(langFilter);
      const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
      return matchesLang && matchesSearch;
    })
    .sort((a, b) => {
      const diffDiff = (DIFFICULTY_ORDER[a.difficulty] ?? 3) - (DIFFICULTY_ORDER[b.difficulty] ?? 3);
      if (diffDiff !== 0) return diffDiff;
      return a.title.localeCompare(b.title);
    });

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Competition Problems</h1>
          <p className="text-gray-400 mt-1">Create and manage problems for your matches</p>
        </div>
        <Link
          to="/teacher/problems/create"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Problem
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-arena-dark border border-arena-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <span className="text-gray-400 text-sm">Filter by language:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLangFilter('')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              langFilter === '' ? 'bg-primary-600 text-white' : 'bg-arena-dark text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => setLangFilter(lang === langFilter ? '' : lang)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors uppercase ${
                langFilter === lang ? 'bg-primary-600 text-white' : 'bg-arena-dark text-gray-400 hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {problems.length === 0 ? (
        <div className="bg-arena-card border border-arena-border rounded-xl p-12 text-center">
          <FileCode className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No problems yet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Create your first competition problem to use in matches
          </p>
          <Link
            to="/teacher/problems/create"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Problem
          </Link>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="bg-arena-card border border-arena-border rounded-xl p-12 text-center">
          <FileCode className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No problems match</h3>
          <p className="text-gray-400 text-sm">Try adjusting your search or language filter.</p>
        </div>
      ) : (
        <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-arena-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Max Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden lg:table-cell">Test Cases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden xl:table-cell">Languages</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {filteredProblems.map((problem) => (
                <tr key={problem._id} className="hover:bg-arena-dark/50">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{problem.title}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {problem.isShared ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-1 w-fit">
                        <Lock className="h-3 w-3" />
                        Shared
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400">Custom</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-gray-400">{problem.maxScore} pts</span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-gray-400">{problem.testCases?.length || 0}</span>
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(problem.allowedLanguages || []).map(lang => (
                        <span key={lang} className="px-1.5 py-0.5 rounded text-xs font-medium uppercase bg-arena-dark text-gray-300">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {(!problem.isShared || user?.role === 'admin') && (
                        <button
                          onClick={() => navigate(`/teacher/problems/edit/${problem._id}`)}
                          className="p-2 text-gray-400 hover:text-primary-400 transition-colors"
                          title="Edit problem"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {(!problem.isShared || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(problem._id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete problem"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherProblems;
