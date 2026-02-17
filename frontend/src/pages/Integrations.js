import React from "react";
import { useNavigate } from "react-router-dom";

const Integrations = () => {
  const navigate = useNavigate();

  const integrations = [
    {
      name: "Google OAuth",
      icon: "🔐",
      category: "Authentication",
      description: "One-click login with your Google account"
    },
    {
      name: "SMTP Email",
      icon: "📧",
      category: "Email",
      description: "Send emails directly from CRM with your own SMTP or our shared service"
    },
    {
      name: "IMAP Sync",
      icon: "📥",
      category: "Email",
      description: "Real-time email sync - receive and track emails within CRM"
    },
    {
      name: "Twilio SMS",
      icon: "💬",
      category: "Communication",
      description: "Send SMS messages to leads and contacts directly"
    },
    {
      name: "ZeroBounce",
      icon: "✅",
      category: "Verification",
      description: "Verify email addresses to maintain clean lead data"
    },
    {
      name: "Numverify",
      icon: "📞",
      category: "Verification",
      description: "Validate phone numbers for accurate contact data"
    }
  ];

  const features = [
    {
      title: "Email Integration",
      items: [
        "Send emails from CRM",
        "IMAP sync for incoming emails",
        "Email templates",
        "Track emails",
        "Bulk email campaigns"
      ]
    },
    {
      title: "Communication",
      items: [
        "SMS messaging via Twilio",
        "Bulk messaging",
        "Message personalization",
        "Contact management",
        "Activity tracking"
      ]
    },
    {
      title: "Verification",
      items: [
        "Email verification",
        "Phone number validation",
        "Lead validation",
        "Bounce prevention",
        "Data quality"
      ]
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-block px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            INTEGRATIONS
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
            Connected Services
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            Powerful integrations to supercharge your CRM workflow
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-20 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">Available Integrations</h2>
            <p className="text-xl text-gray-400">Connect with the tools you use</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg hover:bg-white/10 transition transform hover:-translate-y-2"
              >
                <div className="text-4xl mb-3">{integration.icon}</div>
                <h3 className="text-lg font-bold text-white mb-1">{integration.name}</h3>
                <span className="text-xs text-purple-400 font-medium">{integration.category}</span>
                <p className="text-gray-400 text-sm mt-2">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">What You Can Do</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-lg">
                <h3 className="text-xl font-bold text-white mb-6">{feature.title}</h3>
                <ul className="space-y-3">
                  {feature.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-400">
                      <span className="text-green-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#1e293b] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Ready to Connect?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Start using all integrations with your free trial
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition transform hover:scale-105"
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

export default Integrations;
