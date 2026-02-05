import { Link } from 'react-router-dom';
import { Code2, Zap, Shield, Trophy, Users, Clock, ArrowRight } from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Competitions',
      description: 'Access-code protected lobbies with hidden problems revealed only when matches start.',
    },
    {
      icon: Zap,
      title: 'Real-time Battles',
      description: 'Compete live with other participants. See the leaderboard update in real-time.',
    },
    {
      icon: Trophy,
      title: 'Practice Mode',
      description: 'Hone your skills with public sample problems before entering competitions.',
    },
    {
      icon: Users,
      title: 'Role-based Access',
      description: 'Students compete, teachers create matches, admins manage the platform.',
    },
    {
      icon: Clock,
      title: 'Timed Challenges',
      description: 'Race against the clock to solve problems and climb the leaderboard.',
    },
    {
      icon: Code2,
      title: 'Multiple Languages',
      description: 'Write solutions in C with standard university libraries.',
    },
  ];

  return (
    <div className="bg-base-200">
      <div className="hero min-h-[70vh] bg-gradient-to-br from-primary/10 to-transparent">
        <div className="hero-content text-center py-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                CodeArena
              </span>
            </h1>
            <p className="text-xl text-base-content/70 mb-10">
              The ultimate programming competition platform. Practice with sample problems, 
              join secure lobbies, and compete in real-time coding battles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-primary btn-lg gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>


      <div className="py-20 bg-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Compete
            </h2>
            <p className="text-base-content/70 max-w-2xl mx-auto">
              CodeArena provides a complete platform for programming competitions 
              with fair play at its core.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="card-body">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="text-base-content/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-base-content/70">Join the arena in three simple steps</p>
          </div>
          <ul className="steps steps-vertical lg:steps-horizontal w-full">
            <li className="step step-primary" data-content="1">
              <div className="text-left lg:text-center mt-4 lg:mt-8">
                <h3 className="text-xl font-semibold mb-2">Create Account</h3>
                <p className="text-base-content/70 text-sm">
                  Sign up as a student to compete or as a teacher to create matches.
                </p>
              </div>
            </li>
            <li className="step step-primary" data-content="2">
              <div className="text-left lg:text-center mt-4 lg:mt-8">
                <h3 className="text-xl font-semibold mb-2">Practice or Join</h3>
                <p className="text-base-content/70 text-sm">
                  Solve sample problems to practice, or enter an access code to join a match.
                </p>
              </div>
            </li>
            <li className="step step-primary" data-content="3">
              <div className="text-left lg:text-center mt-4 lg:mt-8">
                <h3 className="text-xl font-semibold mb-2">Compete & Win</h3>
                <p className="text-base-content/70 text-sm">
                  Solve problems, submit solutions, and climb the leaderboard.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>


      <div className="py-20 bg-gradient-to-r from-primary/20 to-secondary/20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Enter the Arena?
          </h2>
          <p className="text-base-content/70 mb-8">
            Join thousands of developers competing in CodeArena. Start your journey today.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg gap-2">
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
