import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: "👥",
      title: "Lead Management",
      description: "Capture, track, and convert leads with our intelligent pipeline system",
      color: "#3B82F6"
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description: "Get real-time insights with customizable dashboards and reports",
      color: "#10B981"
    },
    {
      icon: "✉️",
      title: "Email Integration",
      description: "Connect Gmail, Outlook, and sync all your communications",
      color: "#8B5CF6"
    },
    {
      icon: "📅",
      title: "Calendar Sync",
      description: "Integrated Google Calendar for seamless meeting scheduling",
      color: "#F59E0B"
    },
    {
      icon: "🎯",
      title: "Task Automation",
      description: "Automate repetitive tasks and focus on closing deals",
      color: "#EF4444"
    },
    {
      icon: "🔒",
      title: "Enterprise Security",
      description: "Bank-level encryption with role-based access control",
      color: "#06B6D4"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Users" },
    { number: "50,000+", label: "Leads Managed" },
    { number: "98%", label: "Customer Satisfaction" },
    { number: "24/7", label: "Support Available" }
  ];

  const testimonials = [
    {
      name: "M Shibli",
      company: "Texora AI",
      role: "CEO",
      image: "👨‍💼",
      text: "CRM Orbit transformed our sales process. We've seen a 40% increase in conversions within 3 months!"
    },
    {
      name: "Arati kumari",
      company: "Digital Marketing ",
      role: "Marketing Head",
      image: "👩‍💼",
      text: "The best CRM we've used. Email integration and analytics are game-changers for our team."
    },
    {
      name: "Anand kumar",
      company: "StartUp Hub",
      role: "Founder",
      image: "👨‍💻",
      text: "Perfect for startups! Easy to use, affordable, and scales with our growing business needs."
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      features: [
        "Up to 5 users",
        "1,000 contacts",
        "Basic analytics",
        "Email support"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "₹999",
      period: "per month",
      features: [
        "Up to 25 users",
        "Unlimited contacts",
        "Advanced analytics",
        "Priority support",
        "Email & Calendar integration",
        "Custom reports"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      features: [
        "Unlimited users",
        "Unlimited everything",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "On-premise deployment"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <nav 
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white shadow-lg py-3' 
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CRM Orbit
            </div>
          </div>

          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Pricing
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Reviews
            </a>
            <button
              onClick={() => navigate("/reseller/register")}
              className="px-4 py-2 text-purple-600 font-semibold hover:bg-purple-50 rounded-lg transition border-2 border-purple-600"
            >
              🤝 Become Partner
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition transform hover:scale-105"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animation */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                ⚡ #1 CRM Solution in India
              </div>
              
              <h1 className="text-6xl font-extrabold text-gray-900 leading-tight">
                Grow Your Business
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  10x Faster
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                The all-in-one CRM platform trusted by 10,000+ businesses. 
                Manage leads, automate workflows, and close more deals with our powerful tools.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/register")}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition transform hover:scale-105 text-lg"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-blue-600 hover:text-blue-600 transition text-lg"
                >
                  Watch Demo →
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 pt-6">
                <div className="flex items-center gap-2">
                  <div className="text-yellow-500 text-2xl">⭐⭐⭐⭐⭐</div>
                  <span className="text-gray-600 font-medium">4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🔒</div>
                  <span className="text-gray-600 font-medium">ISO Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">✅</div>
                  <span className="text-gray-600 font-medium">GDPR Compliant</span>
                </div>
              </div>
            </div>

           
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-base md:text-lg text-blue-100 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              ✨ POWERFUL FEATURES
            </div>
            <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From lead capture to deal closure, we've got all the tools you need
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${
                  activeFeature === index ? 'ring-4 ring-blue-500' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                  style={{ background: `${feature.color}20` }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                📧 Email Integration That Actually Works
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Connect Gmail and Outlook in seconds. Track opens, clicks, and replies automatically. 
                Never miss a follow-up with smart reminders.
              </p>
              <ul className="space-y-4">
                {[
                  "Two-way Gmail & Outlook sync",
                  "Email templates & automation",
                  "Track opens and clicks in real-time",
                  "Smart reply suggestions with AI"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 rounded-2xl">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    ✉️
                  </div>
                  <div>
                    <div className="font-bold">New Lead Email</div>
                    <div className="text-sm text-gray-500">2 mins ago</div>
                  </div>
                </div>
                <p className="text-gray-600">Meeting scheduled automatically via AI...</p>
              </div>
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 bg-gradient-to-br from-purple-100 to-pink-100 p-8 rounded-2xl">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-2xl mb-4">📅</div>
                <div className="font-bold text-lg mb-2">Today's Schedule</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">10:00 AM - Client Meeting</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">2:00 PM - Follow-up Call</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                📅 Calendar Sync Made Simple
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Integrate Google Calendar and never double-book again. 
                Auto-schedule meetings with leads and get smart reminders.
              </p>
              <ul className="space-y-4">
                {[
                  "Google Calendar two-way sync",
                  "Automatic meeting scheduling",
                  "Timezone detection & conversion",
                  "Smart notification system"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
              💬 CUSTOMER REVIEWS
            </div>
            <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
              Loved by 10,000+ Businesses
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl">{testimonial.image}</div>
                  <div>
                    <div className="font-bold text-lg">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                    <div className="text-sm text-blue-600">{testimonial.company}</div>
                  </div>
                </div>
                <div className="text-yellow-500 mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-600 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              💰 SIMPLE PRICING
            </div>
            <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'ring-4 ring-blue-500 shadow-2xl scale-105'
                    : 'shadow-lg'
                } transition-all hover:shadow-2xl`}
              >
                {plan.highlighted && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full inline-block mb-4">
                    ⭐ MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2">/{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/register")}
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reseller Partner Program */}
      <section className="py-24 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-6">
              💰 Become a Reseller Partner
            </h2>
            <p className="text-2xl opacity-90 max-w-3xl mx-auto">
              Earn 10% recurring commission on every client you refer. 
              Join our partner program and grow your income!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl text-center">
              <div className="text-6xl mb-4">💵</div>
              <h3 className="text-2xl font-bold mb-3">10% Commission</h3>
              <p className="opacity-90">Earn recurring monthly commission on every subscription</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-3">Partner Dashboard</h3>
              <p className="opacity-90">Track your clients and earnings in real-time</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-3">Full Support</h3>
              <p className="opacity-90">Get dedicated support to help you succeed</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/reseller/register")}
              className="px-12 py-5 bg-white text-purple-600 font-bold rounded-xl hover:shadow-2xl transition transform hover:scale-105 text-xl"
            >
              Apply to Become a Partner →
            </button>
            <p className="mt-6 opacity-90">
              Already a partner?{' '}
              <button
                onClick={() => navigate("/reseller/login")}
                className="font-bold underline hover:opacity-80"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-2xl text-gray-600 mb-12">
            Join 10,000+ businesses already growing with CRM Orbit
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition transform hover:scale-105 text-xl"
            >
              Start Free Trial - No Credit Card Required
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-12 py-5 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-blue-600 hover:text-blue-600 transition text-xl"
            >
              Sign In to Your Account
            </button>
          </div>
          <p className="mt-8 text-gray-500">
            ✅ Free forever plan available • ✅ No credit card required • ✅ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CRM Orbit
              </div>
              <p className="text-gray-400 mb-6">
                The all-in-one CRM platform trusted by 10,000+ businesses across India.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition">
                  📘
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-400 transition">
                  🐦
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-600 transition">
                  📷
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition">
                  💼
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Partners</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <button 
                    onClick={() => navigate("/reseller/register")} 
                    className="hover:text-white transition text-left"
                  >
                    Become a Partner
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/reseller/login")} 
                    className="hover:text-white transition text-left"
                  >
                    Partner Login
                  </button>
                </li>
                <li><a href="#" className="hover:text-white transition">Partner Resources</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">© 2025 CRMOrbit. All rights reserved.</p>
            <div className="flex gap-6 text-gray-400">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate("/register")}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition transform hover:scale-110 flex items-center justify-center text-2xl z-50"
      >
        🚀
      </button>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;