import React from "react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  const team = [
    {
      role: "CEO & Founder",
      image: "👨‍💼",
      description: "Visionary leader with 10+ years in tech industry"
    },
    {
      role: "Marketing Head",
      image: "👩‍💼",
      description: "Expert in digital marketing and brand strategy"
    },
    {
      role: "Tech Lead",
      image: "👨‍💻",
      description: "Full-stack developer with passion for innovation"
    }
  ];

  const values = [
    {
      icon: "🎯",
      title: "Customer First",
      description: "We put our customers at the center of everything we do"
    },
    {
      icon: "💡",
      title: "Innovation",
      description: "Constantly improving and adding new features"
    },
    {
      icon: "🤝",
      title: "Trust",
      description: "Building long-term relationships with transparency"
    },
    {
      icon: "🚀",
      title: "Excellence",
      description: "Delivering the best quality in every aspect"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Navigation */}
      <nav className="bg-[#0f172a]/90 backdrop-blur-xl shadow-lg py-4 sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-white rounded-lg p-1.5">
              <img src="/logo.png" alt="Logo" className="h-5 w-auto object-contain" />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-gray-300 font-medium hover:text-white transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-[#0f172a] text-white relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10"></div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            ABOUT US
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">About Us</h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            We're on a mission to help businesses grow faster with powerful, easy-to-use CRM solutions
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-6">Our Story</h2>
              <p className="text-lg text-gray-400 mb-4">
                Unified CRM was born from a simple idea: businesses deserve a CRM that's powerful yet simple to use.
                Founded in 2024, we set out to create a complete business management solution that combines
                lead management, B2B workflows, email integration, and team collaboration in one platform.
              </p>
              <p className="text-lg text-gray-400 mb-4">
                Today, we help hundreds of businesses streamline their sales processes,
                manage customer relationships, and grow their revenue. Our platform is trusted by
                startups, SMEs, and enterprises across India and beyond.
              </p>
              <p className="text-lg text-gray-400">
                We're powered by <strong className="text-white">Texora AI</strong>, bringing cutting-edge technology
                to help businesses succeed in the digital age.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-lg">
              <div className="text-8xl mb-6">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-2">Our Mission</h3>
              <p className="text-gray-400">
                To empower businesses with tools that make customer management effortless and growth inevitable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">Our Values</h2>
            <p className="text-xl text-gray-400">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-lg hover:bg-white/10 transition transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-400">The people behind Unified CRM</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-lg hover:bg-white/10 transition transform hover:-translate-y-2"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                  {member.image}
                </div>
                <p className="text-purple-400 font-semibold text-lg mb-2">{member.role}</p>
                <p className="text-gray-400 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold mb-2">500+</div>
              <div className="text-purple-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold mb-2">25+</div>
              <div className="text-purple-100">Feature Modules</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold mb-2">99.9%</div>
              <div className="text-purple-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold mb-2">24/7</div>
              <div className="text-purple-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0f172a] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join hundreds of businesses already using Unified CRM
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-4 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">© 2026 Unified CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
