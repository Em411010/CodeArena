import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleProblemsAPI } from '../../services/api';
import { Search, Filter, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SampleProblems = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    fetchProblems();
  }, [difficulty]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;
      
      const { data } = await sampleProblemsAPI.getAll(params);
      setProblems(data.data);
    } catch (error) {
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProblems();
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Practice Problems</h1>
        <p className="text-gray-400 mt-1">
          Solve sample problems to practice and test your skills
        </p>
      </div>

      <div className="bg-arena-card border border-arena-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="w-full pl-10 pr-4 py-2 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-arena-dark border border-arena-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-arena-card border border-arena-border rounded-xl p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No problems found</h3>
          <p className="text-gray-400 text-sm">
            {search || difficulty ? 'Try adjusting your filters' : 'Check back later for new problems'}
          </p>
        </div>
      ) : (
        <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-arena-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Problem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Languages
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {problems.map((problem) => (
                <tr 
                  key={problem._id} 
                  onClick={() => navigate(`/practice/${problem._id}`)}
                  className="hover:bg-arena-dark/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{problem.title}</p>
                      {problem.tags && problem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {problem.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs bg-arena-dark text-gray-400 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {problem.allowedLanguages?.slice(0, 3).map((lang, i) => (
                        <span key={i} className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded capitalize">
                          {lang}
                        </span>
                      ))}
                      {problem.allowedLanguages?.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{problem.allowedLanguages.length - 3}
                        </span>
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

export default SampleProblems;
