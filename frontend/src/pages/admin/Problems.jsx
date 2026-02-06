import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { competitionProblemsAPI } from '../../services/api';
import { FileCode, Plus, Loader2, Edit, Trash2, Lock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProblems = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const toggleShared = async (id, currentValue) => {
    try {
      await competitionProblemsAPI.update(id, { isShared: !currentValue });
      setProblems(problems.map(p => 
        p._id === id ? { ...p, isShared: !currentValue } : p
      ));
      toast.success(!currentValue ? 'Problem is now shared with all teachers' : 'Problem is now private');
    } catch (error) {
      toast.error('Failed to update problem');
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
          <h1 className="text-2xl font-bold text-white">All Problems</h1>
          <p className="text-gray-400 mt-1">Manage all competition problems</p>
        </div>
        <Link
          to="/teacher/problems/create"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Problem
        </Link>
      </div>

      {problems.length === 0 ? (
        <div className="bg-arena-card border border-arena-border rounded-xl p-12 text-center">
          <FileCode className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No problems yet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Create your first competition problem
          </p>
          <Link
            to="/teacher/problems/create"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Problem
          </Link>
        </div>
      ) : (
        <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-arena-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden lg:table-cell">Score</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {problems.map((problem) => (
                <tr key={problem._id} className="hover:bg-arena-dark/50">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{problem.title}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-gray-400">{problem.createdBy?.username}</span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {problem.isShared ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-1 w-fit">
                        <Users className="h-3 w-3" />
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
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-gray-400">{problem.maxScore} pts</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleShared(problem._id, problem.isShared)}
                        className={`p-2 transition-colors ${
                          problem.isShared 
                            ? 'text-blue-400 hover:text-blue-300' 
                            : 'text-gray-400 hover:text-blue-400'
                        }`}
                        title={problem.isShared ? 'Make private' : 'Share with all teachers'}
                      >
                        {problem.isShared ? <Users className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/problems/edit/${problem._id}`)}
                        className="p-2 text-gray-400 hover:text-primary-400 transition-colors"
                        title="Edit problem"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(problem._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete problem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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

export default AdminProblems;
