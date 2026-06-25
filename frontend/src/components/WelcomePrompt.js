import { useState, useEffect } from 'react';

const WelcomePrompt = ({ user, onClose }) => {
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    console.log('👤 Full user object:', user);
    console.log('📋 User role:', user?.role);
    console.log('🔑 User userType:', user?.userType);
    console.log('🔐 User permissions:', user?.permissions);
    console.log('📂 User roles array:', user?.roles);

    setTimeout(() => setShow(true), 300);
  }, [user]);

  // Auto close after 20 seconds
  useEffect(() => {
    if (!show) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show]);

  const handleClose = (dontShowAgain) => {
    setShow(false);
    if (dontShowAgain) {
      // Mark as shown for this session (cleared on browser close or logout)
      sessionStorage.setItem('welcomePromptShown', 'true');
    }
    setTimeout(onClose, 300);
  };

  // Detect available sidebar menu items to show relevant features
  const getAvailableFeatures = () => {
    // Try multiple selectors to find sidebar
    let sidebar = document.querySelector('nav[class*="sidebar"]')
                  || document.querySelector('[class*="sidebar"]')
                  || document.querySelector('aside')
                  || document.querySelector('[role="navigation"]');

    const menuLinks = sidebar
      ? Array.from(sidebar.querySelectorAll('a, button'))
          .map(el => el.textContent.trim())
          .filter(text => text.length > 0)
      : [];

    console.log('🎯 Sidebar element:', sidebar);
    console.log('🎯 Available menu items:', menuLinks);

    // Sidebar check
    const sidebarFeatures = {
      hasLeads: menuLinks.some(m => m.toLowerCase().includes('lead')),
      hasContacts: menuLinks.some(m => m.toLowerCase().includes('contact')),
      hasAccounts: menuLinks.some(m => m.toLowerCase().includes('account')),
      hasTasks: menuLinks.some(m => m.toLowerCase().includes('task')),
      hasTickets: menuLinks.some(m => m.toLowerCase().includes('ticket') || m.toLowerCase().includes('my tickets')),
      hasFeedback: menuLinks.some(m => m.toLowerCase().includes('feedback')),
      hasTeam: menuLinks.some(m => m.toLowerCase().includes('team') || m.toLowerCase().includes('user')),
      hasReports: menuLinks.some(m => m.toLowerCase().includes('report') || m.toLowerCase().includes('analytic')),
      hasTenants: menuLinks.some(m => m.toLowerCase().includes('tenant')),
      hasSupport: menuLinks.some(m => m.toLowerCase().includes('support'))
    };

    return {
      ...sidebarFeatures
    };
  };

  const getRoleContent = () => {
    const role = user?.role?.toLowerCase() || '';
    const userType = user?.userType?.toLowerCase() || '';
    const saasRole = user?.saasRole?.toLowerCase() || '';
    const available = getAvailableFeatures();

    console.log('✅ Available features:', available);
    console.log('🔑 SAAS Role:', user?.saasRole);

    // SAAS Manager check (limited access)
    if (saasRole === 'manager') {
      const features = [
        { title: 'Assigned Tenants', desc: 'View and manage organizations assigned to you' },
        { title: 'Tenant Overview', desc: 'Monitor tenant activities, subscriptions and status' }
      ];

      return {
        badge: 'SAAS MANAGER',
        title: 'Welcome to Manager Dashboard',
        description: 'Manage your assigned organizations',
        features: features
      };
    }

    // SAAS Admin/Owner check
    if (userType === 'saas_admin' || userType === 'saas_owner' || role === 'saasadmin') {
      const features = [
        { title: 'Tenant Management', desc: 'View and manage all tenant organizations and their subscriptions' },
        { title: 'Support System', desc: 'Handle support tickets, escalations and customer queries' },
        { title: 'Feedback Analytics', desc: 'Track customer feedback and sentiment analysis' },
        { title: 'Revenue & Reports', desc: 'Monitor billing, subscriptions and financial analytics' }
      ];

      return {
        badge: 'SAAS ADMINISTRATOR',
        title: 'Welcome to Admin Control Panel',
        description: 'Manage and monitor your entire platform',
        features: features
      };
    }

    // Tenant Admin check
    if (userType === 'tenant_admin' || role === 'tenantadmin' || role === 'admin') {
      // Default core features for Tenant Admin
      const features = [
        { title: 'Team Management', desc: 'Add managers and sales team members with role-based permissions' },
        { title: 'Lead Management', desc: 'Import, assign and track leads across your organization' },
        { title: 'Customer Database', desc: 'Manage contacts, accounts and customer relationships' },
        { title: 'Analytics & Reports', desc: 'Track team performance, conversions and revenue metrics' }
      ];

      return {
        badge: 'ORGANIZATION ADMIN',
        title: 'Welcome to Your CRM Dashboard',
        description: 'Manage your sales operations efficiently',
        features: features
      };
    }

    // Tenant Manager check
    if (userType === 'tenant_manager' || role === 'tenantmanager' || role === 'manager') {
      const features = [
        { title: 'Team Overview', desc: 'Monitor your team members and their daily activities' },
        { title: 'Lead Distribution', desc: 'Assign and track leads across your team members' },
        { title: 'Task Management', desc: 'Create and monitor team tasks and follow-ups' },
        { title: 'Performance Tracking', desc: 'Review team conversion rates and targets' }
      ];

      return {
        badge: 'TEAM MANAGER',
        title: 'Welcome to Manager Dashboard',
        description: 'Lead your team to achieve targets',
        features: features
      };
    }

    // Default: Tenant User - Build features based on permissions (not sidebar DOM)
    const features = [];

    console.log('🔍 DEBUG - user.roles[0]?.permissions:', user?.roles?.[0]?.permissions);

    // Get permissions - either from user.permissions object OR user.roles[0].permissions array
    let permissionObj = {};

    if (user?.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      // Direct permissions object (e.g., {lead_management: {read: true, ...}})
      permissionObj = user.permissions;
      console.log('✅ Using user.permissions object');
    } else if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      // Permissions in roles array (e.g., [{feature: 'rfi_management', actions: ['read', 'create']}])
      const permArray = user.roles[0].permissions || [];
      console.log('✅ Using user.roles[0].permissions array, length:', permArray.length);
      permArray.forEach(p => {
        const actions = p.actions || [];
        permissionObj[p.feature] = {
          read: actions.includes('read'),
          create: actions.includes('create'),
          update: actions.includes('update'),
          delete: actions.includes('delete')
        };
      });
    } else {
      console.log('❌ NO PERMISSIONS FOUND - will show fallback!');
    }

    console.log('🎯 Final permissionObj:', permissionObj);
    console.log('🎯 permissionObj keys:', Object.keys(permissionObj));

    // CRM Features
    if (permissionObj.lead_management?.read) features.push({ title: 'My Leads', desc: 'View and manage leads assigned to you' });
    if (permissionObj.contact_management?.read) features.push({ title: 'My Contacts', desc: 'Manage your customer contacts and relationships' });
    if (permissionObj.account_management?.read) features.push({ title: 'My Accounts', desc: 'Track customer accounts and relationships' });
    if (permissionObj.opportunity_management?.read) features.push({ title: 'Opportunities', desc: 'Manage sales opportunities and deals' });

    // Sales & Finance Features
    if (permissionObj.rfi_management?.read) features.push({ title: 'RFI Management', desc: 'Create and manage Request for Information documents' });
    if (permissionObj.quotation_management?.read) features.push({ title: 'Quotations', desc: 'Create quotes and send to customers' });
    if (permissionObj.invoice_management?.read) features.push({ title: 'Invoices', desc: 'Generate and manage customer invoices' });
    if (permissionObj.purchase_order_management?.read) features.push({ title: 'Purchase Orders', desc: 'Create and track purchase orders' });

    // Product Features
    if (permissionObj.product_management?.read) features.push({ title: 'Product Management', desc: 'Manage product catalog and pricing' });
    if (permissionObj.inventory_management?.read) features.push({ title: 'Inventory', desc: 'Track stock levels and manage inventory' });

    // Task Features
    if (permissionObj.task_management?.read) features.push({ title: 'My Tasks', desc: 'Complete pending tasks and schedule follow-ups' });
    if (permissionObj.meeting_management?.read) features.push({ title: 'Meetings', desc: 'Schedule and manage customer meetings' });
    if (permissionObj.call_management?.read) features.push({ title: 'Calls', desc: 'Log and track customer calls' });
    if (permissionObj.email_management?.read) features.push({ title: 'Email Inbox', desc: 'Manage customer email communications' });

    // Access Management
    if (permissionObj.user_management?.read) features.push({ title: 'Team Management', desc: 'Manage users, roles and permissions' });
    if (permissionObj.audit_logs?.read) features.push({ title: 'Audit Logs', desc: 'Track system activities and changes' });
    if (permissionObj.role_template?.read) features.push({ title: 'Role Templates', desc: 'Create and manage role templates' });
    if (permissionObj.org_chart?.read) features.push({ title: 'Org Chart', desc: 'View organizational hierarchy' });
    if (permissionObj.org_hierarchy?.read) features.push({ title: 'Org Hierarchy', desc: 'Manage organizational structure' });

    // Support Features
    if (permissionObj.support_tickets?.read) features.push({ title: 'My Tickets', desc: 'View and manage your support tickets' });
    if (permissionObj.feedback?.read) features.push({ title: 'Submit Feedback', desc: 'Share feedback and suggestions with the team' });

    // Customer Database
    if (permissionObj.data_center?.read) features.push({ title: 'Customer Database', desc: 'Access comprehensive customer data and insights' });

    // Automation & Marketing
    if (permissionObj.templates?.read) features.push({ title: 'Templates', desc: 'Manage communication templates' });
    if (permissionObj.document_templates?.read) features.push({ title: 'Document Templates', desc: 'Create and manage document templates' });
    if (permissionObj.email_templates?.read) features.push({ title: 'Email Templates', desc: 'Design email templates for campaigns' });
    if (permissionObj.social_media?.read) features.push({ title: 'Social Media', desc: 'Manage social media integrations and posts' });

    // Fallback if no features detected
    if (features.length === 0) {
      features.push(
        { title: 'Dashboard', desc: 'View your daily activities and updates' },
        { title: 'My Work', desc: 'Access your assigned tasks and responsibilities' }
      );
    }

    // Build summary sentence with all features
    const featureList = features.map(f => f.title).join(', ').replace(/, ([^,]*)$/, ' and $1');
    const summary = features.length > 0
      ? `You have access to: ${featureList}. Start managing your work efficiently!`
      : 'Access your daily tasks and activities';

    return {
      badge: 'USER',
      title: 'Welcome to Your Workspace',
      description: summary,
      features: features.slice(0, 4)  // Show top 4 in cards, rest are in description
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!show) return null;

  const content = getRoleContent();
  const userName = user?.firstName || user?.name || 'User';

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalZoom {
          0% { transform: scale(0.9); opacity: 0; filter: blur(10px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(139, 92, 246, 0.2); }
          50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.6), 0 0 60px rgba(139, 92, 246, 0.3); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .welcome-overlay {
          animation: fadeIn 0.5s ease-out;
        }
        .welcome-modal {
          animation: modalZoom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), glow 3s ease-in-out infinite;
        }
        .feature-card {
          animation: slideUp 0.6s ease-out backwards;
        }
        .feature-card:nth-child(1) { animation-delay: 0.15s; }
        .feature-card:nth-child(2) { animation-delay: 0.25s; }
        .feature-card:nth-child(3) { animation-delay: 0.35s; }
        .feature-card:nth-child(4) { animation-delay: 0.45s; }
      `}</style>

      {/* Blur Overlay */}
      <div className="welcome-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(30,30,50,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>

        {/* Main Modal - Glassmorphism */}
        <div className="welcome-modal" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '28px',
          maxWidth: '720px',
          width: '100%',
          boxShadow: '0 30px 90px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.3) inset',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.5)'
        }}>

          {/* Animated Progress Bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255,255,255,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #6366f1)',
              backgroundSize: '200% 100%',
              animation: 'gradientShift 3s linear infinite',
              width: '100%',
              transition: 'width 20s linear',
              willChange: 'width'
            }} />
          </div>

          {/* Header Section - Compact Clean Gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
            padding: '24px 32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle Pattern Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
              pointerEvents: 'none'
            }} />
            {/* Close Button */}
            <button
              onClick={() => handleClose(true)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '20px',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            >×</button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              position: 'relative',
              zIndex: 1,
              paddingRight: '48px'  // Space for close button
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '28px' }}>👋</span>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                  letterSpacing: '-0.3px'
                }}>
                  {getGreeting()}, {userName}!
                </h2>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '9px',
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                border: '1px solid rgba(255,255,255,0.25)',
                flexShrink: 0  // Prevent badge from shrinking
              }}>
                {content.badge}
              </div>
            </div>

            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.85)',
              margin: 0,
              lineHeight: '1.5',
              position: 'relative',
              zIndex: 1
            }}>
              {content.description}
            </p>
          </div>

          {/* Content Section */}
          <div style={{ padding: '32px 36px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: content.features.length >= 3 ? 'repeat(2, 1fr)' : '1fr',
              gap: '16px',
              marginBottom: '28px'
            }}>
              {content.features.map((feature, i) => {
                const colors = [
                  { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '#93c5fd', icon: '🚀' },
                  { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', border: '#f9a8d4', icon: '⚡' },
                  { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '#fcd34d', icon: '✨' },
                  { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '#6ee7b7', icon: '🎯' }
                ];
                const color = colors[i % 4];
                return (
                <div key={i} className="feature-card" style={{
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  borderRadius: '16px',
                  padding: '20px',
                  transition: 'all 0.3s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>{color.icon}</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#064e3b'
                    }}>
                      {feature.title}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    paddingLeft: '34px'
                  }}>
                    {feature.desc}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '16px' }}>⏱️</span>
                Closing in {countdown} seconds
              </div>
              <button
                onClick={() => handleClose(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                Got it, Let's Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomePrompt;
