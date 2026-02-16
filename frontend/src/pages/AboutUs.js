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
      <footer className="bg-[#0f172a] text-white py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg p-1.5">
                <img src="/logo.png" alt="Logo" className="h-5 w-auto object-contain" />
              </div>
              <p className="text-gray-400">© 2026 Unified CRM. All rights reserved.</p>
            </div>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/texoraai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-500/20 hover:border-pink-500/50 transition">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://x.com/texoraai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500/20 hover:border-gray-500/50 transition">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/texora-ai/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600/20 hover:border-blue-600/50 transition">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://www.youtube.com/@Texoraai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600/20 hover:border-red-600/50 transition">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
