import React from "react";
import { useNavigate } from "react-router-dom";

const Security = () => {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: "🔐",
      title: "JWT Authentication",
      description: "Secure token-based authentication with automatic expiry and refresh"
    },
    {
      icon: "🔒",
      title: "Password Encryption",
      description: "All passwords are hashed using bcryptjs - never stored in plain text"
    },
    {
      icon: "🛡️",
      title: "AES-256 Encryption",
      description: "Sensitive data like SMTP credentials encrypted at rest using AES-256-CBC"
    },
    {
      icon: "👥",
      title: "Role-Based Access Control",
      description: "Granular permissions with 5-tier user hierarchy and feature-level access"
    },
    {
      icon: "🏢",
      title: "Multi-Tenant Isolation",
      description: "Complete data separation between organizations - your data stays yours"
    },
    {
      icon: "📋",
      title: "Activity Logging",
      description: "Comprehensive audit trail tracking all user actions with IP and timestamps"
    }
  ];

  const authMethods = [
    { name: "Email & Password", icon: "📧" },
    { name: "Google OAuth 2.0", icon: "🔑" },
    { name: "OTP Verification", icon: "📱" }
  ];

  const userRoles = [
    { role: "SAAS Owner", level: "Full system access" },
    { role: "SAAS Admin", level: "Administrative access" },
    { role: "Tenant Admin", level: "Organization control" },
    { role: "Tenant Manager", level: "Team management" },
    { role: "Tenant User", level: "Standard access" }
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10"></div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            SECURITY
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
            Your Data is Protected
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            Enterprise-grade security built into every layer of Unified CRM
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">Security Features</h2>
            <p className="text-xl text-gray-400">Multiple layers of protection for your business data</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-lg hover:bg-white/10 transition transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authentication Methods */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-6">Authentication Methods</h2>
              <p className="text-lg text-gray-400 mb-8">
                Multiple secure ways to access your account with built-in verification
              </p>
              <div className="space-y-4">
                {authMethods.map((method, index) => (
                  <div key={index} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                    <span className="text-3xl">{method.icon}</span>
                    <span className="text-white font-medium">{method.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-lg">
              <h3 className="text-2xl font-bold text-white mb-6">User Role Hierarchy</h3>
              <div className="space-y-3">
                {userRoles.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                    <span className="text-white font-medium">{item.role}</span>
                    <span className="text-gray-400 text-sm">{item.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-20 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-4">Data Protection</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-green-400 text-4xl mb-3">✓</div>
              <h4 className="text-white font-semibold mb-2">Helmet.js Headers</h4>
              <p className="text-gray-400 text-sm">Security headers protection</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-green-400 text-4xl mb-3">✓</div>
              <h4 className="text-white font-semibold mb-2">CORS Protection</h4>
              <p className="text-gray-400 text-sm">Whitelist-based origin control</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-green-400 text-4xl mb-3">✓</div>
              <h4 className="text-white font-semibold mb-2">Input Validation</h4>
              <p className="text-gray-400 text-sm">All inputs sanitized</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-green-400 text-4xl mb-3">✓</div>
              <h4 className="text-white font-semibold mb-2">Secure Sessions</h4>
              <p className="text-gray-400 text-sm">Stateless JWT tokens</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0f172a] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Your data is safe with us
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition transform hover:scale-105"
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

export default Security;
