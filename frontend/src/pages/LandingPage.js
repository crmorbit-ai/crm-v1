import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeModule, setActiveModule] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tracking for 3D tilt effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);


  const features = [
    {
      icon: "👥",
      title: "Complete Lead Management",
      description: "Capture, track, and convert leads with bulk import, group assignment, and product linking",
      color: "#3B82F6"
    },
    {
      icon: "📋",
      title: "B2B Sales Workflow",
      description: "Complete RFI → Quotation → Purchase Order → Invoice workflow with PDF generation",
      color: "#10B981"
    },
    {
      icon: "✉️",
      title: "Email Integration",
      description: "Built-in email inbox with IMAP sync, tracking, and entity linking",
      color: "#8B5CF6"
    },
    {
      icon: "👨‍💼",
      title: "Accounts & Contacts",
      description: "Manage B2B organizations, contacts, and opportunities with complete relationship tracking",
      color: "#F59E0B"
    },
    {
      icon: "📦",
      title: "Product Management",
      description: "Product catalog, categories, and marketplace with pricing management",
      color: "#EF4444"
    },
    {
      icon: "🎯",
      title: "Multi-Tenancy & Teams",
      description: "Group management, role-based permissions, and complete tenant isolation",
      color: "#06B6D4"
    }
  ];

  const stats = [
    { number: "25+", label: "Feature Modules" },
    { number: "All-in-One", label: "CRM Platform" },
    { number: "100%", label: "Customizable" },
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
        "15-day trial all features",
        "Up to 5 users",
        "1,000 leads & contacts",
        "Basic task management",
        "1GB storage",
        "Email support"
      ],
      highlighted: false
    },
    {
      name: "Basic",
      price: "₹1,499",
      period: "per month",
      features: [
        "Up to 10 users",
        "5,000 leads & contacts",
        "Email integration",
        "Custom fields",
        "5GB storage",
        "Priority email support"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "₹2,999",
      period: "per month",
      features: [
        "Up to 50 users",
        "Unlimited leads & contacts",
        "Complete B2B workflow",
        "Advanced reports",
        "API access",
        "50GB storage",
        "24/7 priority support"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      features: [
        "Unlimited everything",
        "White labeling",
        "Dedicated support",
        "Custom integrations",
        "Multi-currency",
        "SLA guarantee"
      ],
      highlighted: false
    }
  ];

  // 3D Tilt effect calculator
  const calculateTilt = (element, mouseX, mouseY) => {
    if (!element) return { rotateX: 0, rotateY: 0 };
    const rect = element.getBoundingClientRect();
    const x = mouseX - rect.left - rect.width / 2;
    const y = mouseY - rect.top - rect.height / 2;
    const rotateY = (x / rect.width) * 20;
    const rotateX = -(y / rect.height) * 20;
    return { rotateX, rotateY };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <nav
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-lg shadow-lg py-3'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-9xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CRM Logo"
              className="h-6 w-auto object-contain"
            />
          </div>

          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Pricing
            </a>
            <button
              onClick={() => navigate("/reseller/register")}
              className="px-4 py-2 text-purple-600 font-semibold hover:bg-purple-50 rounded-lg transition border-2 border-purple-600"
            >
              🤝 Become Partner
            </button>
            <button
              onClick={() => { navigate('/login'); }}
              className="px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition"
            >
              Sign In
            </button>
            <button
              onClick={() => { navigate('/register'); }}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition transform hover:scale-105"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Particles & Morphing Shapes */}
      <section ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 grid-background"></div>

        {/* Particle System */}
        <div className="particles-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 20}s`
              }}
            />
          ))}
        </div>

        {/* Morphing Blob Shapes */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-morph"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-morph animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-morph animation-delay-4000"></div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 glass-card text-blue-700 rounded-full text-sm font-semibold">
                ⚡ #1 CRM Solution in India
              </div>

              <h1 className="text-6xl font-extrabold text-gray-900 leading-tight">
                Grow Your Business
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                  10x Faster
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Complete CRM solution with B2B sales workflow, email integration, and powerful team management.
                From leads to invoices - manage your entire sales pipeline in one platform.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => { navigate('/register'); }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl transition transform hover:scale-105 text-lg animate-gradient-shift"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => { navigate('/login'); }}
                  className="px-8 py-4 glass-card text-gray-700 font-bold rounded-xl hover:border-blue-600 hover:text-blue-600 transition text-lg"
                >
                  Sign In →
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

            {/* Right Side - 3D Floating Dashboard Preview */}
            <div className="relative">
              <div className="glass-card-strong p-8 rounded-3xl shadow-2xl transform-3d">
                <div className="space-y-4">
                  {/* Mini Dashboard Elements - FLOATING */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl animate-float">
                    <div className="text-4xl">📊</div>
                    <div className="text-white">
                      <div className="font-bold text-lg">Real-time Analytics</div>
                      <div className="text-sm opacity-90">Track your sales pipeline</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl animate-float animation-delay-500">
                    <div className="text-4xl">💰</div>
                    <div className="text-white">
                      <div className="font-bold text-lg">Revenue Growth</div>
                      <div className="text-sm opacity-90">+45% this month</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-500 to-blue-500 rounded-xl animate-float animation-delay-1000">
                    <div className="text-4xl">🎯</div>
                    <div className="text-white">
                      <div className="font-bold text-lg">Lead Conversion</div>
                      <div className="text-sm opacity-90">98% success rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Parallax */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'moveGrid 20s linear infinite'
          }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-110 transition duration-300">
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 animate-count-up">
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

      {/* Moving Feature Marquee */}
      <section className="py-8 bg-white overflow-hidden">
        <div className="marquee-container">
          <div className="marquee-content">
            {[
              "📋 Leads", "👥 Contacts", "🏢 Accounts", "💼 Opportunities",
              "📄 RFI", "💰 Quotations", "📦 Purchase Orders", "🧾 Invoices",
              "✅ Tasks", "📅 Meetings", "📞 Calls", "✉️ Email Inbox",
              "📊 Data Center", "🎫 Support Tickets", "👨‍💼 Users & Roles",
              "🔧 Field Builder", "📦 Products", "🏷️ Categories", "🤝 Reseller Program"
            ].map((item, i) => (
              <span key={i} className="marquee-item">
                {item}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {[
              "📋 Leads", "👥 Contacts", "🏢 Accounts", "💼 Opportunities",
              "📄 RFI", "💰 Quotations", "📦 Purchase Orders", "🧾 Invoices",
              "✅ Tasks", "📅 Meetings", "📞 Calls", "✉️ Email Inbox",
              "📊 Data Center", "🎫 Support Tickets", "👨‍💼 Users & Roles",
              "🔧 Field Builder", "📦 Products", "🏷️ Categories", "🤝 Reseller Program"
            ].map((item, i) => (
              <span key={`dup-${i}`} className="marquee-item">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Complete CRM Ecosystem - Rotating Box */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
        {/* Background Particles */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500 rounded-full animate-particle-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Heading */}
            <div>
              <h3 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                <span className="text-gray-900">Complete CRM </span>
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  Ecosystem
                </span>
              </h3>
              <p className="text-xl text-gray-600 mb-8">
                Everything you need to manage your business from a single platform
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">18+ Powerful Modules</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Complete B2B Workflow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Real-time Automation</span>
                </div>
              </div>
            </div>

            {/* Right Side - Rotating Showcase Box */}
            <div>
              <div className="rotating-showcase-box">
                <div className="showcase-content" key={activeModule}>
                  <div className="text-8xl mb-6">
                    {[
                      { icon: "📋", label: "Leads", desc: "Capture, track, and convert leads with intelligent pipeline" },
                      { icon: "👥", label: "Contacts", desc: "Complete contact management with relationship tracking" },
                      { icon: "🏢", label: "Accounts", desc: "B2B organization and company management system" },
                      { icon: "💼", label: "Opportunities", desc: "Sales pipeline with stage tracking and forecasting" },
                      { icon: "📄", label: "RFI", desc: "Request for Information management with responses" },
                      { icon: "💰", label: "Quotations", desc: "Professional quotation generation with PDF export" },
                      { icon: "📦", label: "Purchase Orders", desc: "PO processing with approval workflows" },
                      { icon: "🧾", label: "Invoices", desc: "Invoice creation with payment tracking" },
                      { icon: "✅", label: "Tasks", desc: "Task management with priorities and assignments" },
                      { icon: "📅", label: "Meetings", desc: "Meeting scheduling with video call integration" },
                      { icon: "📞", label: "Calls", desc: "Call logging and tracking system" },
                      { icon: "✉️", label: "Email Inbox", desc: "Built-in email with IMAP sync and tracking" },
                      { icon: "📊", label: "Data Center", desc: "Candidate and prospect database management" },
                      { icon: "🎫", label: "Support Tickets", desc: "Complete ticketing system with SLA tracking" },
                      { icon: "👨‍💼", label: "Users & Roles", desc: "Role-based access control and permissions" },
                      { icon: "🔧", label: "Field Builder", desc: "Custom field builder for any entity" },
                      { icon: "📦", label: "Products", desc: "Product catalog with pricing management" },
                      { icon: "🤝", label: "Reseller Program", desc: "Partner management with commission tracking" }
                    ][activeModule].icon}
                  </div>
                  <h4 className="text-4xl font-bold text-white mb-4">
                    {[
                      { icon: "📋", label: "Leads", desc: "Capture, track, and convert leads with intelligent pipeline" },
                      { icon: "👥", label: "Contacts", desc: "Complete contact management with relationship tracking" },
                      { icon: "🏢", label: "Accounts", desc: "B2B organization and company management system" },
                      { icon: "💼", label: "Opportunities", desc: "Sales pipeline with stage tracking and forecasting" },
                      { icon: "📄", label: "RFI", desc: "Request for Information management with responses" },
                      { icon: "💰", label: "Quotations", desc: "Professional quotation generation with PDF export" },
                      { icon: "📦", label: "Purchase Orders", desc: "PO processing with approval workflows" },
                      { icon: "🧾", label: "Invoices", desc: "Invoice creation with payment tracking" },
                      { icon: "✅", label: "Tasks", desc: "Task management with priorities and assignments" },
                      { icon: "📅", label: "Meetings", desc: "Meeting scheduling with video call integration" },
                      { icon: "📞", label: "Calls", desc: "Call logging and tracking system" },
                      { icon: "✉️", label: "Email Inbox", desc: "Built-in email with IMAP sync and tracking" },
                      { icon: "📊", label: "Data Center", desc: "Candidate and prospect database management" },
                      { icon: "🎫", label: "Support Tickets", desc: "Complete ticketing system with SLA tracking" },
                      { icon: "👨‍💼", label: "Users & Roles", desc: "Role-based access control and permissions" },
                      { icon: "🔧", label: "Field Builder", desc: "Custom field builder for any entity" },
                      { icon: "📦", label: "Products", desc: "Product catalog with pricing management" },
                      { icon: "🤝", label: "Reseller Program", desc: "Partner management with commission tracking" }
                    ][activeModule].label}
                  </h4>
                  <p className="text-xl text-blue-100">
                    {[
                      { icon: "📋", label: "Leads", desc: "Capture, track, and convert leads with intelligent pipeline" },
                      { icon: "👥", label: "Contacts", desc: "Complete contact management with relationship tracking" },
                      { icon: "🏢", label: "Accounts", desc: "B2B organization and company management system" },
                      { icon: "💼", label: "Opportunities", desc: "Sales pipeline with stage tracking and forecasting" },
                      { icon: "📄", label: "RFI", desc: "Request for Information management with responses" },
                      { icon: "💰", label: "Quotations", desc: "Professional quotation generation with PDF export" },
                      { icon: "📦", label: "Purchase Orders", desc: "PO processing with approval workflows" },
                      { icon: "🧾", label: "Invoices", desc: "Invoice creation with payment tracking" },
                      { icon: "✅", label: "Tasks", desc: "Task management with priorities and assignments" },
                      { icon: "📅", label: "Meetings", desc: "Meeting scheduling with video call integration" },
                      { icon: "📞", label: "Calls", desc: "Call logging and tracking system" },
                      { icon: "✉️", label: "Email Inbox", desc: "Built-in email with IMAP sync and tracking" },
                      { icon: "📊", label: "Data Center", desc: "Candidate and prospect database management" },
                      { icon: "🎫", label: "Support Tickets", desc: "Complete ticketing system with SLA tracking" },
                      { icon: "👨‍💼", label: "Users & Roles", desc: "Role-based access control and permissions" },
                      { icon: "🔧", label: "Field Builder", desc: "Custom field builder for any entity" },
                      { icon: "📦", label: "Products", desc: "Product catalog with pricing management" },
                      { icon: "🤝", label: "Reseller Program", desc: "Partner management with commission tracking" }
                    ][activeModule].desc}
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="progress-dots">
                  {Array.from({ length: 18 }).map((_, index) => (
                    <div
                      key={index}
                      className={`progress-dot ${activeModule === index ? 'active' : ''}`}
                      onClick={() => setActiveModule(index)}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with 3D Tilt Cards */}
      <section id="features" className="py-24 bg-gray-50 relative overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid-lines-background"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 glass-card text-blue-700 rounded-full text-sm font-semibold mb-4">
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
                className={`glass-card-strong p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer tilt-card ${
                  activeFeature === index ? 'ring-4 ring-blue-500' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color}40, ${feature.color}20)`
                  }}
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
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-500 rounded-full animate-particle-float opacity-50"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                📋 Complete B2B Sales Workflow
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Streamline your entire sales process from inquiry to payment.
                Professional document generation with built-in PDF export.
              </p>
              <ul className="space-y-4">
                {[
                  "RFI (Request for Information) Management",
                  "Professional Quotation Generation",
                  "Purchase Order Processing",
                  "Invoice Creation with Payment Tracking"
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
            <div className="glass-card p-8 rounded-2xl transform hover:scale-105 transition duration-500">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    📋
                  </div>
                  <div>
                    <div className="font-bold">Quotation #QT-2025-00123</div>
                    <div className="text-sm text-gray-500">Status: Accepted</div>
                  </div>
                </div>
                <p className="text-gray-600">Convert to Invoice → PO-2025-00045</p>
              </div>
            </div>
          </div>

          {/* Team & Customization */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 glass-card p-8 rounded-2xl transform hover:scale-105 transition duration-500">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-2xl mb-4">👥</div>
                <div className="font-bold text-lg mb-2">Team Assignment</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Sales Team - 12 members</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Support Team - 5 members</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                🎯 Powerful Team Management
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Organize teams with groups, assign leads to specific members,
                and control access with role-based permissions.
              </p>
              <ul className="space-y-4">
                {[
                  "Group-based lead assignment",
                  "Role-based access control",
                  "Custom field builder for any entity",
                  "Activity logs and audit trail"
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

      {/* Pricing Section with 3D Cards */}
      <section id="pricing" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid-lines-background"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 glass-card text-purple-700 rounded-full text-sm font-semibold mb-4">
              💰 SIMPLE PRICING
            </div>
            <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`glass-card-strong rounded-2xl p-8 tilt-card ${
                  plan.highlighted
                    ? 'ring-4 ring-blue-500 shadow-2xl scale-105'
                    : 'shadow-lg'
                } transition-all hover:shadow-2xl`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.highlighted && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full inline-block mb-4 animate-pulse">
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
                      <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                        ✓
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { navigate('/register'); }}
                  className={`w-full py-3 rounded-xl font-bold transition transform hover:scale-105 ${
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
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-morph"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-morph animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-6 animate-slide-in">
              💰 Become a Reseller Partner
            </h2>
            <p className="text-2xl opacity-90 max-w-3xl mx-auto animate-slide-in animation-delay-200">
              Earn 10% recurring commission on every client you refer.
              Join our partner program and grow your income!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: "💵", title: "10% Commission", desc: "Earn recurring monthly commission on every subscription" },
              { icon: "📊", title: "Partner Dashboard", desc: "Track your clients and earnings in real-time" },
              { icon: "🎯", title: "Full Support", desc: "Get dedicated support to help you succeed" }
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/20 backdrop-blur-lg p-8 rounded-2xl text-center transform hover:scale-110 transition duration-500 animate-float border border-white/30"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className="text-6xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-white/90">{item.desc}</p>
              </div>
            ))}
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
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6 animate-slide-in">
            Ready to Transform Your Business?
          </h2>
          <p className="text-2xl text-gray-600 mb-12 animate-slide-in animation-delay-200">
            Start managing leads, quotations, and invoices in one powerful platform
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => { navigate('/register'); }}
              className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition transform hover:scale-105 text-xl"
            >
              Start Free Trial - No Credit Card Required
            </button>
            <button
              onClick={() => { navigate('/login'); }}
              className="px-12 py-5 glass-card text-gray-700 font-bold rounded-xl hover:border-blue-600 hover:text-blue-600 transition text-xl"
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
              <img
                src="/logo.png"
                alt="CRM Logo"
                className="h-7 w-auto object-contain mb-4"
              />
              <p className="text-gray-400 mb-6">
                Complete CRM solution with B2B workflow, email integration, team management, and more.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition transform hover:scale-110">
                  📘
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-400 transition transform hover:scale-110">
                  🐦
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-600 transition transform hover:scale-110">
                  📷
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition transform hover:scale-110">
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
        onClick={() => { navigate('/register'); }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition transform hover:scale-110 flex items-center justify-center text-2xl z-50"
      >
        🚀
      </button>

      <style jsx>{`
        /* Gradient Animation */
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient-shift 3s ease infinite;
        }
        .animate-gradient-shift {
          background-size: 200% auto;
          animation: gradient-shift 3s ease infinite;
        }

        /* Morphing Blobs */
        @keyframes morph {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: translate(20px, -50px) scale(1.1) rotate(90deg);
          }
          50% {
            border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
            transform: translate(-20px, 20px) scale(0.9) rotate(180deg);
          }
          75% {
            border-radius: 70% 30% 50% 50% / 30% 50% 60% 40%;
            transform: translate(50px, 50px) scale(1.05) rotate(270deg);
          }
        }
        .animate-morph {
          animation: morph 15s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }

        /* Particles */
        .particles-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          opacity: 0.6;
          animation: float-particle 15s infinite;
        }
        @keyframes float-particle {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) translateX(100px) scale(0.5);
            opacity: 0;
          }
        }

        /* Grid Background */
        .grid-background {
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: moveGrid 20s linear infinite;
        }
        .grid-lines-background {
          width: 100%;
          height: 100%;
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.1) 2px, transparent 2px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 2px, transparent 2px);
          background-size: 100px 100px;
          animation: moveGrid 30s linear infinite;
        }
        @keyframes moveGrid {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        /* Floating Animation */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        /* Particle Float */
        @keyframes particle-float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-30px) translateX(20px);
            opacity: 1;
          }
        }
        .animate-particle-float {
          animation: particle-float 6s ease-in-out infinite;
        }

        /* Bounce Slow */
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        /* Count Up */
        @keyframes count-up {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-count-up {
          animation: count-up 1s ease-out;
        }

        /* Slide In */
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.8s ease-out forwards;
        }

        /* Slide Right */
        @keyframes slide-right {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-right {
          animation: slide-right 0.6s ease-out forwards;
        }

        /* Glassmorphism */
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .glass-card-strong {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        /* 3D Tilt Cards */
        .tilt-card {
          transform-style: preserve-3d;
          transition: transform 0.3s ease;
        }
        .tilt-card:hover {
          transform: perspective(1000px) rotateX(5deg) rotateY(5deg);
        }

        /* Transform 3D */
        .transform-3d {
          transform-style: preserve-3d;
        }

        /* Floating Dashboard */
        .floating-dashboard {
          animation: float-dashboard 6s ease-in-out infinite;
        }
        @keyframes float-dashboard {
          0%, 100% { transform: translateY(0px) rotateY(0deg); }
          50% { transform: translateY(-30px) rotateY(5deg); }
        }

        /* Marquee Animation */
        .marquee-container {
          width: 100%;
          overflow: hidden;
          background: linear-gradient(to right, #f8fafc, #ffffff, #f8fafc);
          padding: 20px 0;
          position: relative;
        }
        .marquee-container::before,
        .marquee-container::after {
          content: '';
          position: absolute;
          top: 0;
          width: 100px;
          height: 100%;
          z-index: 2;
        }
        .marquee-container::before {
          left: 0;
          background: linear-gradient(to right, white, transparent);
        }
        .marquee-container::after {
          right: 0;
          background: linear-gradient(to left, white, transparent);
        }
        .marquee-content {
          display: flex;
          animation: marquee 40s linear infinite;
          width: fit-content;
        }
        .marquee-item {
          display: inline-block;
          padding: 12px 24px;
          margin: 0 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 30px;
          font-weight: 600;
          font-size: 15px;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }

        /* Rotating Showcase Box */
        .rotating-showcase-box {
          background: linear-gradient(135deg,
            #f472b6 0%,    /* Light Pink */
            #c084fc 25%,   /* Light Purple */
            #818cf8 50%,   /* Light Indigo */
            #60a5fa 75%,   /* Light Blue */
            #22d3ee 100%   /* Light Cyan */
          );
          border-radius: 32px;
          padding: 60px 40px;
          text-align: center;
          box-shadow:
            0 20px 60px rgba(244, 114, 182, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset;
          position: relative;
          overflow: hidden;
          min-height: 450px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 3px solid transparent;
          background-clip: padding-box;
        }
        .rotating-showcase-box::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            60deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shine 4s infinite;
        }
        .rotating-showcase-box::after {
          content: '';
          position: absolute;
          inset: -3px;
          background: linear-gradient(
            45deg,
            #f472b6,
            #c084fc,
            #818cf8,
            #60a5fa,
            #22d3ee,
            #f472b6
          );
          border-radius: 32px;
          z-index: -1;
          background-size: 300% 300%;
          animation: gradientRotate 8s ease infinite;
        }
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(60deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(60deg); }
        }
        @keyframes gradientRotate {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .showcase-content {
          position: relative;
          z-index: 1;
          animation: fadeInScale 0.8s ease-out;
        }
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Progress Dots */
        .progress-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 30px;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }
        .progress-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .progress-dot:hover {
          background: rgba(255, 255, 255, 0.6);
          transform: scale(1.3);
        }
        .progress-dot.active {
          background: white;
          width: 30px;
          border-radius: 5px;
        }

        /* Parallax Content */
        .parallax-content {
          animation: parallax-float 4s ease-in-out infinite;
        }
        @keyframes parallax-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
