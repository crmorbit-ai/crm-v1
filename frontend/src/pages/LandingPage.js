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
    <div className="min-h-screen bg-[#0f172a]">
      {/* Sticky Navigation */}
      <nav
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0f172a]/90 backdrop-blur-lg shadow-lg py-3 border-b border-white/5'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-9xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5">
              <img
                src="/logo.png"
                alt="CRM Logo"
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>

          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-gray-300 hover:text-white font-medium transition">
              Features
            </a>
            <button
              onClick={() => navigate("/reseller/register")}
              className="px-4 py-2 text-purple-400 font-semibold hover:bg-purple-500/10 rounded-lg transition border-2 border-purple-500/50"
            >
              🤝 Become Partner
            </button>
            <button
              onClick={() => { navigate('/login'); }}
              className="px-4 py-2 text-gray-300 font-semibold hover:text-white rounded-lg transition"
            >
              Sign In
            </button>
            <button
              onClick={() => { navigate('/register'); }}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition transform hover:scale-105"
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
              <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-sm font-semibold backdrop-blur-sm">
                ⚡ #1 CRM Solution in India
              </div>

              <h1 className="text-6xl font-extrabold text-white leading-tight">
                Grow Your Business
                <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                  10x Faster
                </span>
              </h1>

              <p className="text-xl text-gray-400 leading-relaxed">
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
                  className="px-8 py-4 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition text-lg"
                >
                  Sign In →
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 pt-6">
                <div className="flex items-center gap-2">
                  <div className="text-yellow-500 text-2xl">⭐⭐⭐⭐⭐</div>
                  <span className="text-gray-400 font-medium">4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🔒</div>
                  <span className="text-gray-400 font-medium">ISO Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">✅</div>
                  <span className="text-gray-400 font-medium">GDPR Compliant</span>
                </div>
              </div>
            </div>

            {/* Right Side - 3D Floating Dashboard Preview */}
            <div className="relative">
              <div className="bg-white/5 border border-white/10 backdrop-blur-lg p-8 rounded-3xl">
                <div className="space-y-4">
                  {/* Mini Dashboard Elements - FLOATING */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl animate-float">
                    <div className="text-4xl">📊</div>
                    <div className="text-white">
                      <div className="font-bold text-lg">Real-time Analytics</div>
                      <div className="text-sm opacity-90">Track your sales pipeline</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl animate-float animation-delay-500">
                    <div className="text-4xl">💰</div>
                    <div className="text-white">
                      <div className="font-bold text-lg">Revenue Growth</div>
                      <div className="text-sm opacity-90">+45% this month</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl animate-float animation-delay-1000">
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
      <section className="py-8 bg-[#0f172a] overflow-hidden">
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
      <section className="py-20 bg-[#1e293b] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Heading */}
            <div>
              <h3 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                <span className="text-white">Complete CRM </span>
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  Ecosystem
                </span>
              </h3>
              <p className="text-xl text-gray-400 mb-8">
                Everything you need to manage your business from a single platform
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                  <span className="text-gray-300 font-medium">18+ Powerful Modules</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
                  <span className="text-gray-300 font-medium">Complete B2B Workflow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
                  <span className="text-gray-300 font-medium">Real-time Automation</span>
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
      <section id="features" className="py-24 bg-[#1e293b] relative overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid-lines-background"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
              ✨ POWERFUL FEATURES
            </div>
            <h2 className="text-5xl font-extrabold text-white mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From lead capture to deal closure, we've got all the tools you need
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white/5 border border-white/10 backdrop-blur-lg p-8 rounded-2xl hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${
                  activeFeature === index ? 'ring-2 ring-purple-500' : ''
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
                <h3 className="text-2xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-24 bg-[#0f172a] relative overflow-hidden">
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
              <h2 className="text-4xl font-extrabold text-white mb-6">
                📋 Complete B2B Sales Workflow
              </h2>
              <p className="text-lg text-gray-400 mb-6">
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
                    <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-gray-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-lg p-8 rounded-2xl transform hover:scale-105 transition duration-500">
              <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    📋
                  </div>
                  <div>
                    <div className="font-bold text-white">Quotation #QT-2025-00123</div>
                    <div className="text-sm text-gray-400">Status: Accepted</div>
                  </div>
                </div>
                <p className="text-gray-400">Convert to Invoice → PO-2025-00045</p>
              </div>
            </div>
          </div>

          {/* Team & Customization */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 bg-white/5 border border-white/10 backdrop-blur-lg p-8 rounded-2xl transform hover:scale-105 transition duration-500">
              <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                <div className="text-2xl mb-4">👥</div>
                <div className="font-bold text-lg mb-2 text-white">Team Assignment</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Sales Team - 12 members</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Support Team - 5 members</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-extrabold text-white mb-6">
                🎯 Powerful Team Management
              </h2>
              <p className="text-lg text-gray-400 mb-6">
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
                    <div className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-gray-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* Reseller Partner Program */}
      <section className="py-24 bg-[#0f172a] text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
              PARTNER PROGRAM
            </div>
            <h2 className="text-5xl font-extrabold mb-6 text-white">
              💰 Become a Reseller Partner
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
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
                className="bg-white/5 border border-white/10 backdrop-blur-lg p-8 rounded-2xl text-center transform hover:scale-105 hover:bg-white/10 transition duration-500"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className="text-6xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/reseller/register")}
              className="px-12 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition transform hover:scale-105 text-xl"
            >
              Apply to Become a Partner →
            </button>
            <p className="mt-6 text-gray-400">
              Already a partner?{' '}
              <button
                onClick={() => navigate("/reseller/login")}
                className="font-bold text-purple-400 hover:text-purple-300"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#1e293b] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl font-extrabold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-2xl text-gray-400 mb-12">
            Start managing leads, quotations, and invoices in one powerful platform
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => { navigate('/register'); }}
              className="px-12 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition transform hover:scale-105 text-xl"
            >
              Start Free Trial - No Credit Card Required
            </button>
            <button
              onClick={() => { navigate('/login'); }}
              className="px-12 py-5 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition text-xl"
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
      <footer className="bg-[#0f172a] text-white py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg p-1.5 inline-block mb-4">
                <img
                  src="/logo.png"
                  alt="CRM Logo"
                  className="h-5 w-auto object-contain"
                />
              </div>
              <p className="text-gray-400 mb-6">
                Complete CRM solution with B2B workflow, email integration, team management, and more.
              </p>
              <div className="flex gap-3">
                {/* Instagram - Gradient */}
                <a href="https://www.instagram.com/texoraai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-500/20 hover:border-pink-500/50 transition transform hover:scale-110">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFDC80" />
                        <stop offset="25%" stopColor="#F77737" />
                        <stop offset="50%" stopColor="#E1306C" />
                        <stop offset="75%" stopColor="#C13584" />
                        <stop offset="100%" stopColor="#833AB4" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* X/Twitter - White */}
                <a href="https://x.com/texoraai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 hover:border-white/50 transition transform hover:scale-110">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                {/* LinkedIn - Blue */}
                <a href="https://www.linkedin.com/company/texora-ai/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600/20 hover:border-blue-600/50 transition transform hover:scale-110">
                  <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                {/* YouTube - Red */}
                <a href="https://www.youtube.com/@Texoraai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600/20 hover:border-red-600/50 transition transform hover:scale-110">
                  <svg className="w-5 h-5" fill="#FF0000" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><button onClick={() => navigate("/security")} className="hover:text-white transition text-left">Security</button></li>
                <li><button onClick={() => navigate("/integrations")} className="hover:text-white transition text-left">Integrations</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => navigate("/about")} className="hover:text-white transition text-left">About Us</button></li>
                <li><a href="https://texora.ai/career" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Careers</a></li>
                <li><a href="https://texora.ai/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Contact</a></li>
                <li><a href="https://texora.ai/blogs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Blog</a></li>
                
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
                <li><a href="https://texora.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Partner Resources</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">© 2026 Unified CRM. All rights reserved.</p>
            <div className="flex gap-6 text-gray-400">
              <a href="https://texora.ai/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Privacy Policy</a>
              <a href="https://texora.ai/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Terms of Service</a>
              {/* <a href="https://texora.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Cookie Policy</a> */}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      

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
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-card-strong {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
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
          background: #0f172a;
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
          background: linear-gradient(to right, #0f172a, transparent);
        }
        .marquee-container::after {
          right: 0;
          background: linear-gradient(to left, #0f172a, transparent);
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
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
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
            #7c3aed 0%,    /* Purple */
            #8b5cf6 25%,   /* Violet */
            #6366f1 50%,   /* Indigo */
            #3b82f6 75%,   /* Blue */
            #6366f1 100%   /* Indigo */
          );
          border-radius: 32px;
          padding: 60px 40px;
          text-align: center;
          box-shadow:
            0 20px 60px rgba(139, 92, 246, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
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
            rgba(255, 255, 255, 0.15),
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
            #7c3aed,
            #8b5cf6,
            #6366f1,
            #3b82f6,
            #6366f1,
            #7c3aed
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
