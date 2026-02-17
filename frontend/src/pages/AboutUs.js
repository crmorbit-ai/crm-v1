import React from "react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  const team = [
    {
      role: "CEO & Founder",
      icon: "👨‍💼",
      description: "Visionary leader driving product innovation"
    },
    {
      role: "Marketing Head",
      icon: "👩‍💼",
      description: "Building brand and customer relationships"
    },
    {
      role: "Tech Lead",
      icon: "👨‍💻",
      description: "Architecting scalable CRM solutions"
    }
  ];

  const crmFeatures = [
    { name: "Lead Management", icon: "🎯" },
    { name: "Contact & Account Management", icon: "👥" },
    { name: "Sales Pipeline", icon: "📊" },
    { name: "Email Integration", icon: "📧" },
    { name: "Task & Meeting Management", icon: "✅" },
    { name: "Quotations & Invoices", icon: "📄" },
    { name: "Support Tickets", icon: "🎫" },
    { name: "Multi-tenant SaaS", icon: "🏢" }
  ];

  const values = [
    {
      icon: "🎯",
      title: "Customer First",
      description: "Everything we build starts with customer needs"
    },
    {
      icon: "💡",
      title: "Innovation",
      description: "Continuously improving with AI and modern tech"
    },
    {
      icon: "🔒",
      title: "Security",
      description: "Enterprise-grade protection for your data"
    },
    {
      icon: "🚀",
      title: "Simplicity",
      description: "Powerful features, easy to use interface"
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10"></div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            ABOUT US
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
            Building the Future of CRM
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            A complete business management solution built for modern teams
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
                Unified CRM was built to solve a real problem - businesses need a CRM that's powerful
                yet simple to use. We combined lead management, B2B workflows, email integration,
                and team collaboration into one platform.
              </p>
              <p className="text-lg text-gray-400 mb-4">
                Our platform helps businesses streamline sales, manage customer relationships,
                and grow revenue. From startups to enterprises, Unified CRM adapts to your needs.
              </p>
              <p className="text-lg text-gray-400">
                Powered by <strong className="text-white">Texora AI</strong>, we bring cutting-edge
                technology to help businesses succeed.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-lg">
              <div className="text-8xl mb-6">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-2">Our Mission</h3>
              <p className="text-gray-400">
                Make customer management effortless and business growth inevitable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CRM Features */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">What We Offer</h2>
            <p className="text-xl text-gray-400">Complete CRM solution in one platform</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {crmFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-center backdrop-blur-lg hover:bg-white/10 transition"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-white font-medium text-sm">{feature.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">Our Values</h2>
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
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">Our Team</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-lg hover:bg-white/10 transition transform hover:-translate-y-2"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                  {member.icon}
                </div>
                <p className="text-purple-400 font-semibold text-lg mb-2">{member.role}</p>
                <p className="text-gray-400 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#1e293b] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Try Unified CRM free for 15 days
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
