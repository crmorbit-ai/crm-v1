import React from "react";
import { useNavigate } from "react-router-dom";

const PartnerResources = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: "💰",
      title: "Earn Commission",
      description: "Earn up to 10% commission on every customer you bring"
    },
    {
      icon: "📊",
      title: "Partner Dashboard",
      description: "Track your referrals, commissions, and payouts in real-time"
    },
    {
      icon: "🔗",
      title: "Unique Referral Code",
      description: "Get your own referral code to share with potential customers"
    },
    {
      icon: "💳",
      title: "Easy Payouts",
      description: "Receive payments directly to your bank account or UPI"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Apply",
      description: "Fill out the partner application form"
    },
    {
      step: "2",
      title: "Get Approved",
      description: "Our team reviews and approves your application"
    },
    {
      step: "3",
      title: "Share",
      description: "Share your unique referral code with businesses"
    },
    {
      step: "4",
      title: "Earn",
      description: "Earn commission when they subscribe"
    }
  ];

  const features = [
    "Track all onboarded customers",
    "View commission history",
    "Download payout reports",
    "Manage payment details",
    "Access partner support"
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
              onClick={() => navigate("/reseller/login")}
              className="px-4 py-2 text-gray-300 font-medium hover:text-white transition"
            >
              Partner Login
            </button>
            <button
              onClick={() => navigate("/reseller/register")}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition"
            >
              Become a Partner
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
            PARTNER PROGRAM
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
            Partner Resources
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            Join our partner program and grow your business with Unified CRM
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">Partner Benefits</h2>
            <p className="text-xl text-gray-400">Why become a Unified CRM partner?</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-lg hover:bg-white/10 transition transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Dashboard Features */}
      <section className="py-20 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-6">Partner Dashboard</h2>
              <p className="text-lg text-gray-400 mb-8">
                Access your dedicated partner dashboard to manage everything in one place.
              </p>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-300">
                    <span className="text-green-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-lg">
              <div className="text-8xl mb-6">🤝</div>
              <h3 className="text-2xl font-bold text-white mb-2">10% Commission</h3>
              <p className="text-gray-400">
                Earn commission on every subscription from your referrals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0f172a] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Ready to Partner With Us?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Start earning by referring businesses to Unified CRM
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/reseller/register")}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition transform hover:scale-105"
            >
              Apply Now
            </button>
            <button
              onClick={() => navigate("/reseller/login")}
              className="px-8 py-4 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition"
            >
              Partner Login
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

export default PartnerResources;
