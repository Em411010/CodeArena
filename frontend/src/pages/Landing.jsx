import { Link } from 'react-router-dom';
import { Code2, Zap, Shield, Trophy, Users, Clock, ArrowRight, ChevronRight } from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Competitions',
      description: 'Access-code protected lobbies with hidden problems revealed only when matches start.',
      color: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-400',
      glow: 'group-hover:shadow-blue-500/20',
    },
    {
      icon: Zap,
      title: 'Real-time Battles',
      description: 'Compete live with other participants. See the leaderboard update in real-time.',
      color: 'from-yellow-500/20 to-yellow-600/5',
      iconColor: 'text-yellow-400',
      glow: 'group-hover:shadow-yellow-500/20',
    },
    {
      icon: Trophy,
      title: 'Practice Mode',
      description: 'Hone your skills with public sample problems before entering competitions.',
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-400',
      glow: 'group-hover:shadow-amber-500/20',
    },
    {
      icon: Users,
      title: 'Role-based Access',
      description: 'Students compete, teachers create matches, admins manage the platform.',
      color: 'from-purple-500/20 to-purple-600/5',
      iconColor: 'text-purple-400',
      glow: 'group-hover:shadow-purple-500/20',
    },
    {
      icon: Clock,
      title: 'Timed Challenges',
      description: 'Race against the clock to solve problems and climb the leaderboard.',
      color: 'from-rose-500/20 to-rose-600/5',
      iconColor: 'text-rose-400',
      glow: 'group-hover:shadow-rose-500/20',
    },
    {
      icon: Code2,
      title: 'Multiple Languages',
      description: 'Write solutions in C, C++, Python, Java, and JavaScript.',
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/20',
    },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up as a student to compete or as a teacher to create matches.' },
    { num: '02', title: 'Practice or Join', desc: 'Solve sample problems to practice, or enter an access code to join a match.' },
    { num: '03', title: 'Compete & Win', desc: 'Submit solutions, see instant results, and climb the leaderboard.' },
  ];

  return (
    <div className="bg-[#070b14] text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Flowing orbs */}
        <div className="orb-1 absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="orb-2 absolute bottom-[10%] right-[10%] w-[440px] h-[440px] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />
        <div className="orb-3 absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />

        {/* Light beam sweep */}
        <div className="animate-beam absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px'}}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="animate-float-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live Coding Competitions
          </div>

          <h1 className="animate-float-up-delay-1 text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            Enter the{' '}
            <span
              className="animate-gradient-shift text-transparent bg-clip-text"
              style={{backgroundImage: 'linear-gradient(135deg, #38bdf8, #818cf8, #e879f9, #38bdf8)'}}
            >
              CodeArena
            </span>
          </h1>

          <p className="animate-float-up-delay-2 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            The ultimate programming competition platform. Practice with sample problems,
            join secure lobbies, and compete in real-time coding battles.
          </p>

          <div className="animate-float-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300"
              style={{background: 'linear-gradient(135deg, #0ea5e9, #818cf8)', boxShadow: '0 0 30px rgba(14,165,233,0.35)'}}
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              Sign In
              <ChevronRight className="h-4 w-4 opacity-60" />
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#070b14] to-transparent pointer-events-none" />
      </section>

      {/* ── FEATURES ── */}
      <section className="relative py-28 px-6">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Compete</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              CodeArena provides a complete platform for programming competitions with fair play at its core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group relative rounded-2xl border border-white/5 bg-white/[0.03] p-6 hover:border-white/10 hover:bg-white/[0.06] transition-all duration-300 hover:shadow-xl ${feature.glow}`}
              >
                {/* Card gradient accent */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="orb-2 absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[130px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-secondary text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-white/50">Join the arena in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center p-6">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-[-calc(50%-40px)] h-px bg-gradient-to-r from-white/20 to-transparent" />
                )}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black mb-5 border border-white/10"
                  style={{background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(129,140,248,0.15))', boxShadow: '0 0 30px rgba(14,165,233,0.1)'}}
                >
                  <span className="text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(135deg, #38bdf8, #818cf8)'}}>{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 px-6 overflow-hidden">
        {/* Flowing gradient background */}
        <div
          className="animate-gradient-shift absolute inset-0 opacity-20 pointer-events-none"
          style={{backgroundImage: 'linear-gradient(135deg, #0ea5e9, #818cf8, #e879f9, #0ea5e9)', backgroundSize: '300% 300%'}}
        />
        <div className="absolute inset-0 bg-[#070b14]/60 pointer-events-none" />
        <div className="orb-1 absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            Ready to Enter the{' '}
            <span
              className="animate-gradient-shift text-transparent bg-clip-text"
              style={{backgroundImage: 'linear-gradient(135deg, #38bdf8, #818cf8, #e879f9, #38bdf8)'}}
            >
              Arena?
            </span>
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Join developers competing in CodeArena. Start your journey today — it's free.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 hover:scale-105"
            style={{background: 'linear-gradient(135deg, #0ea5e9, #818cf8)', boxShadow: '0 0 50px rgba(14,165,233,0.4)'}}
          >
            Create Free Account
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
