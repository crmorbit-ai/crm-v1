const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');

// Import ALL CRM models
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Account = require('../models/Account');
const Opportunity = require('../models/Opportunity');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const Call = require('../models/Call');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const PurchaseOrder = require('../models/PurchaseOrder');
const RFI = require('../models/RFI');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const Note = require('../models/Note');
const SupportTicket = require('../models/SupportTicket');
const Subscription = require('../models/Subscription');
const ActivityLog = require('../models/ActivityLog');

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  getModel() {
    if (!this.model) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY missing');
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
    return this.model;
  }

  /**
   * COMPLETE CRM KNOWLEDGE BASE
   */
  getCRMKnowledge() {
    return `
## 🏢 CRM APPLICATION - COMPLETE KNOWLEDGE BASE

### 📱 MODULES & FEATURES:

#### 1. LEADS MODULE (/leads)
- Purpose: Capture and track potential customers
- Fields: First Name, Last Name, Email, Phone, Company, Status, Source, Rating
- Statuses: New, Contacted, Qualified, Converted, Lost
- Sources: Website, Referral, Cold Call, Advertisement, Social Media, Trade Show, Partner
- Features: Lead verification (email/phone), Lead conversion to Contact/Account, Bulk upload, Data Center import
- Actions: Create, Edit, Delete, Convert to Contact, Assign to User

#### 2. CONTACTS MODULE (/contacts)
- Purpose: Store customer/prospect contact information
- Fields: First Name, Last Name, Email, Phone, Mobile, Title, Department, Account
- Linked to: Accounts, Opportunities
- Features: Contact history, Activity timeline, Email/Call logging

#### 3. ACCOUNTS MODULE (/accounts)
- Purpose: Store company/organization records
- Fields: Account Name, Industry, Website, Phone, Address, Owner
- Industries: Technology, Healthcare, Finance, Retail, Manufacturing, Education, etc.
- Features: Related Contacts, Opportunities, Activities

#### 4. OPPORTUNITIES MODULE (/opportunities)
- Purpose: Track sales deals through pipeline
- Fields: Opportunity Name, Amount, Stage, Probability, Close Date, Account, Owner
- Stages (Pipeline):
  1. Qualification (10%)
  2. Needs Analysis (20%)
  3. Value Proposition (40%)
  4. Id. Decision Makers (60%)
  5. Perception Analysis (70%)
  6. Proposal/Price Quote (75%)
  7. Negotiation/Review (90%)
  8. Closed Won (100%)
  9. Closed Lost (0%)
- Features: Pipeline view, Forecast, Amount tracking

#### 5. TASKS MODULE (/tasks)
- Purpose: To-do items and follow-ups
- Fields: Subject, Status, Priority, Due Date, Assigned To, Related To
- Statuses: Not Started, In Progress, Completed, Waiting, Deferred
- Priorities: Low, Normal, High, Urgent
- Features: Due date reminders, Assignment

#### 6. MEETINGS MODULE (/meetings)
- Purpose: Schedule and track meetings
- Fields: Title, Start Time, End Time, Location, Attendees, Description
- Features: Calendar integration, Reminders

#### 7. CALLS MODULE (/calls)
- Purpose: Log phone calls
- Fields: Subject, Call Type (Inbound/Outbound), Duration, Status, Related To
- Features: Call logging, Call scheduling

#### 8. EMAILS MODULE (/emails)
- Purpose: Send and receive emails
- Features: SMTP integration, Email templates, Email tracking, IMAP sync
- Configuration: Uses SMTP_HOST, SMTP_PORT, SMTP_USER from settings

#### 9. QUOTATIONS MODULE (/quotations)
- Purpose: Create and send quotes to customers
- Fields: Quote Number, Account, Contact, Products, Amount, Validity
- Workflow: Draft → Sent → Accepted/Rejected
- Features: PDF generation, Email sending

#### 10. INVOICES MODULE (/invoices)
- Purpose: Generate invoices
- Fields: Invoice Number, Account, Products, Amount, Due Date, Status
- Statuses: Draft, Sent, Paid, Overdue, Cancelled
- Features: PDF generation, Payment tracking

#### 11. PURCHASE ORDERS MODULE (/purchase-orders)
- Purpose: Manage purchase orders
- Fields: PO Number, Vendor, Products, Amount, Status
- Workflow: Draft → Approved → Sent → Received

#### 12. RFI MODULE (/rfi)
- Purpose: Request for Information management
- Fields: RFI Number, Customer, Products, Requirements
- Workflow: RFI → Quotation → PO → Invoice

#### 13. PRODUCTS MODULE (/products, /products-management)
- Purpose: Product catalog management
- Fields: Product Name, Category, SKU, Price, Description
- Features: Categories, Inventory tracking

#### 14. DATA CENTER (/data-center)
- Purpose: Centralized data repository
- Features: Import leads from data center, Candidate database

#### 15. SUPPORT TICKETS (/support)
- Purpose: Customer support management
- Fields: Subject, Description, Priority, Status, Category
- Statuses: Open, In Progress, Resolved, Closed
- Features: Ticket assignment, Resolution tracking

### 👥 USER MANAGEMENT:

#### Users (/settings/users)
- Create, edit, delete users
- Assign roles and permissions
- User types: TENANT_ADMIN, TENANT_USER

#### Roles (/settings/roles)
- Create custom roles
- Assign permissions to roles
- Default roles: Admin, Sales Manager, Sales Rep

#### Groups (/settings/groups)
- Create user groups
- Team management
- Group-based assignments

### ⚙️ SETTINGS & CONFIGURATION:

#### Field Builder (/admin/field-builder)
- Create custom fields for any module
- Field types: Text, Number, Email, Phone, Date, Dropdown, Checkbox, etc.
- Add fields to: Leads, Contacts, Accounts, Opportunities

#### Profile (/profile)
- Update user profile
- Change password
- Notification settings

### 🔐 AUTHENTICATION:
- Email/Password login
- Google OAuth login
- Two-step registration (Email verification)
- Password reset
- Session management

### 📊 DASHBOARDS:

#### Tenant Dashboard (/dashboard)
- Lead statistics
- Pipeline overview
- Task summary
- Recent activities
- Charts and graphs

#### SAAS Dashboard (/saas/dashboard)
- Tenant management
- Subscription overview
- Revenue analytics
- System health

### 💰 SUBSCRIPTION & BILLING:
- Subscription plans
- Payment integration (Razorpay)
- Invoice generation
- Usage tracking

### 🔗 INTEGRATIONS:
- Google OAuth (Login)
- SMTP (Emails)
- IMAP (Email sync)
- Twilio (WhatsApp, SMS)
- Razorpay (Payments)
- Google Gemini (AI)

### 📱 API ENDPOINTS:
- /api/auth - Authentication
- /api/leads - Lead management
- /api/contacts - Contact management
- /api/accounts - Account management
- /api/opportunities - Opportunity management
- /api/tasks - Task management
- /api/meetings - Meeting management
- /api/calls - Call management
- /api/emails - Email management
- /api/quotations - Quotation management
- /api/invoices - Invoice management
- /api/purchase-orders - PO management
- /api/rfi - RFI management
- /api/products - Product management
- /api/users - User management
- /api/roles - Role management
- /api/groups - Group management
- /api/ai - AI features
- /api/support-tickets - Support tickets
- /api/subscriptions - Subscriptions
- /api/billings - Billing

### 🎨 FRONTEND PAGES:
- /login - Login page
- /register - Registration
- /dashboard - Main dashboard
- /leads - Leads list
- /leads/:id - Lead detail
- /contacts - Contacts list
- /contacts/:id - Contact detail
- /accounts - Accounts list
- /accounts/:id - Account detail
- /opportunities - Opportunities list
- /tasks - Tasks list
- /meetings - Meetings list
- /calls - Calls list
- /emails - Email inbox
- /quotations - Quotations
- /invoices - Invoices
- /purchase-orders - Purchase orders
- /rfi - RFI list
- /products - Product marketplace
- /products-management - Product management
- /data-center - Data center
- /support - Support tickets
- /settings/users - User management
- /settings/roles - Role management
- /settings/groups - Group management
- /admin/field-builder - Custom fields
- /profile - User profile
- /subscription - Subscription management

### 🏗️ ARCHITECTURE:
- Frontend: React.js
- Backend: Node.js + Express
- Database: MongoDB (Multi-tenant)
- Authentication: JWT + Google OAuth
- Real-time: Socket.io
- AI: Google Gemini
`;
  }

  /**
   * Get System Configuration
   */
  getSystemConfig() {
    return {
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.EMAIL_FROM,
        fromName: process.env.EMAIL_FROM_NAME
      },
      server: {
        port: process.env.PORT || 4000,
        environment: process.env.NODE_ENV,
        frontendUrl: process.env.FRONTEND_URL
      },
      integrations: {
        googleOAuth: {
          configured: !!process.env.GOOGLE_CLIENT_ID,
          clientId: process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'
        },
        twilio: {
          configured: !!process.env.TWILIO_ACCOUNT_SID,
          whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
        },
        razorpay: {
          configured: !!process.env.RAZORPAY_KEY_ID
        },
        geminiAI: {
          configured: !!process.env.GEMINI_API_KEY
        }
      },
      database: {
        mainDB: 'MongoDB Atlas (crm-anand)',
        dataCenterDB: 'MongoDB Atlas (crm-global-data)'
      },
      saasAdmin: {
        emails: process.env.SAAS_ADMIN_EMAILS
      }
    };
  }

  /**
   * Get ALL CRM Data
   */
  async getAllCRMData(tenantId) {
    try {
      if (!tenantId) return null;

      const tid = typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId;


      const [
        leads, contacts, accounts, opportunities, tasks,
        meetings, calls, notes, quotations, invoices,
        purchaseOrders, rfis, products, supportTickets, users
      ] = await Promise.all([
        Lead.find({ tenant: tid, isActive: { $ne: false } }).populate('createdBy', 'firstName lastName').lean(),
        Contact.find({ tenant: tid, isActive: { $ne: false } }).populate('account', 'name').lean(),
        Account.find({ tenant: tid, isActive: { $ne: false } }).populate('owner', 'firstName lastName').lean(),
        Opportunity.find({ tenant: tid, isActive: { $ne: false } }).populate('owner', 'firstName lastName').populate('account', 'name').lean(),
        Task.find({ tenant: tid }).populate('assignedTo', 'firstName lastName').lean(),
        Meeting.find({ tenant: tid }).populate('host', 'firstName lastName').lean(),
        Call.find({ tenant: tid }).lean(),
        Note.find({ tenant: tid }).lean(),
        Quotation.find({ tenant: tid }).populate('account', 'name').lean().catch(() => []),
        Invoice.find({ tenant: tid }).populate('account', 'name').lean().catch(() => []),
        PurchaseOrder.find({ tenant: tid }).lean().catch(() => []),
        RFI.find({ tenant: tid }).lean().catch(() => []),
        Product.find({ tenant: tid }).lean().catch(() => []),
        SupportTicket.find({ tenant: tid }).lean().catch(() => []),
        User.find({ tenant: tid }).select('firstName lastName email userType isActive').lean()
      ]);

      return {
        leads: (() => {
          const leadData = leads.map(l => ({
            name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'No Name',
            company: l.company || 'No Company',
            email: l.email,
            phone: l.phone || l.mobile,
            status: l.leadStatus || 'New',
            source: l.source || 'Unknown',
            rating: l.rating
          }));
          return { total: leadData.length, data: leadData };
        })(),
        contacts: (() => {
          const contactData = contacts.map(c => {
            const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
            return {
              name: name || 'No Name',
              email: c.email || 'No Email',
              phone: c.phone || c.mobilePhone || 'No Phone',
              company: c.account?.name || 'No Company',
              jobTitle: c.jobTitle || ''
            };
          }).filter(c => c.name !== 'No Name' || c.email !== 'No Email');
          return { total: contactData.length, data: contactData };
        })(),
        accounts: {
          total: accounts.length,
          data: accounts.map(a => ({
            name: a.name,
            industry: a.industry,
            website: a.website,
            owner: a.owner ? `${a.owner.firstName} ${a.owner.lastName}` : 'Unassigned'
          }))
        },
        opportunities: {
          total: opportunities.length,
          totalValue: opportunities.reduce((sum, o) => sum + (o.amount || 0), 0),
          data: opportunities.map(o => ({
            name: o.opportunityName,
            stage: o.stage,
            amount: o.amount,
            amountFormatted: `₹${(o.amount || 0).toLocaleString('en-IN')}`,
            probability: o.probability,
            owner: o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : 'Unassigned',
            account: o.account?.name,
            closeDate: o.closeDate ? new Date(o.closeDate).toLocaleDateString('en-IN') : 'Not set'
          })),
          byStage: opportunities.reduce((acc, o) => {
            const stage = o.stage || 'Unknown';
            if (!acc[stage]) acc[stage] = { count: 0, amount: 0, opportunities: [] };
            acc[stage].count++;
            acc[stage].amount += o.amount || 0;
            acc[stage].opportunities.push({
              name: o.opportunityName,
              amount: `₹${(o.amount || 0).toLocaleString('en-IN')}`,
              owner: o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : 'Unassigned'
            });
            return acc;
          }, {})
        },
        tasks: {
          total: tasks.length,
          pending: tasks.filter(t => ['pending', 'in_progress', 'Pending', 'In Progress', 'Not Started'].includes(t.status)).length,
          data: tasks.map(t => ({
            subject: t.subject,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : 'No date',
            assignedTo: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned'
          }))
        },
        meetings: {
          total: meetings.length,
          data: meetings.map(m => ({
            title: m.title,
            from: m.from,
            to: m.to,
            location: m.location,
            host: m.host ? `${m.host.firstName} ${m.host.lastName}` : 'Unknown',
            status: m.status
          }))
        },
        calls: {
          total: calls.length,
          data: calls.slice(0, 10).map(c => ({
            subject: c.subject,
            type: c.callType,
            status: c.status,
            duration: c.duration
          }))
        },
        quotations: {
          total: quotations.length,
          data: quotations.slice(0, 10).map(q => ({
            number: q.quotationNumber,
            account: q.account?.name,
            amount: q.totalAmount,
            status: q.status
          }))
        },
        invoices: {
          total: invoices.length,
          data: invoices.slice(0, 10).map(i => ({
            number: i.invoiceNumber,
            account: i.account?.name,
            amount: i.totalAmount,
            status: i.status
          }))
        },
        purchaseOrders: { total: purchaseOrders.length },
        rfis: { total: rfis.length },
        products: { total: products.length },
        supportTickets: {
          total: supportTickets.length,
          open: supportTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length
        },
        users: {
          total: users.length,
          data: users.map(u => ({
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            role: u.userType,
            active: u.isActive
          }))
        }
      };
    } catch (error) {
      console.error('Data fetch error:', error);
      return null;
    }
  }

  /**
   * MAIN CHAT - KNOWS EVERYTHING!
   */
  async chat(message, context = {}) {
    try {
      const model = this.getModel();

      const crmKnowledge = this.getCRMKnowledge();
      const systemConfig = this.getSystemConfig();
      const crmData = context.tenantId ? await this.getAllCRMData(context.tenantId) : null;


      const systemPrompt = `You are an EXPERT AI ASSISTANT for this CRM application. You have COMPLETE KNOWLEDGE of everything:

## 📚 CRM APPLICATION KNOWLEDGE:
${crmKnowledge}

## ⚙️ SYSTEM CONFIGURATION:
${JSON.stringify(systemConfig, null, 2)}

## 📊 LIVE DATABASE (User's Actual Data):
${crmData ? `
### SUMMARY:
- Leads: ${crmData.leads.total}
- Contacts: ${crmData.contacts.total}
- Accounts: ${crmData.accounts.total}
- Opportunities: ${crmData.opportunities.total} (Total Value: ₹${crmData.opportunities.totalValue.toLocaleString('en-IN')})
- Tasks: ${crmData.tasks.total} (Pending: ${crmData.tasks.pending})
- Meetings: ${crmData.meetings.total}
- Calls: ${crmData.calls.total}
- Quotations: ${crmData.quotations.total}
- Invoices: ${crmData.invoices.total}
- Users: ${crmData.users.total}

### ALL LEADS (${crmData.leads.total}):
${crmData.leads.data.map((l, i) => `${i+1}. ${l.name} | ${l.company} | ${l.email || 'No email'} | Status: ${l.status} | Source: ${l.source}`).join('\n') || 'No leads'}

### ALL CONTACTS (${crmData.contacts.total}):
${crmData.contacts.data.map((c, i) => `${i+1}. ${c.name} | ${c.email} | ${c.company} | ${c.title || ''}`).join('\n') || 'No contacts'}

### ALL ACCOUNTS (${crmData.accounts.total}):
${crmData.accounts.data.map((a, i) => `${i+1}. ${a.name} | Industry: ${a.industry || 'Not set'} | Owner: ${a.owner}`).join('\n') || 'No accounts'}

### OPPORTUNITIES BY STAGE:
${Object.entries(crmData.opportunities.byStage).map(([stage, data]) => `
**${stage}** (${data.count} deals, ₹${data.amount.toLocaleString('en-IN')}):
${data.opportunities.map((o, i) => `  ${i+1}. "${o.name}" - ${o.amount} | Owner: ${o.owner}`).join('\n')}`).join('\n') || 'No opportunities'}

### ALL TASKS (${crmData.tasks.total}):
${crmData.tasks.data.map((t, i) => `${i+1}. ${t.subject} | Status: ${t.status} | Priority: ${t.priority} | Due: ${t.dueDate} | Assigned: ${t.assignedTo}`).join('\n') || 'No tasks'}

### USERS (${crmData.users.total}):
${crmData.users.data.map((u, i) => `${i+1}. ${u.name} | ${u.email} | Role: ${u.role} | Active: ${u.active}`).join('\n') || 'No users'}
` : 'No data available'}

## CURRENT USER:
- Name: ${context.userName || 'User'}
- Role: ${context.userRole || 'User'}
- Time: ${new Date().toLocaleString('en-IN')}

## YOUR CAPABILITIES - YOU CAN ANSWER ANYTHING:
1. **CRM Data**: Leads, contacts, accounts, opportunities, tasks, meetings, etc.
2. **System Config**: SMTP settings, integrations, database, server
3. **How-To**: How to use any feature, create records, settings
4. **Features**: What modules exist, what they do, how they work
5. **Analytics**: Statistics, pipeline, conversion, performance
6. **General**: Any question about the application

## CRITICAL INSTRUCTIONS:
1. **USE ONLY THE EXACT DATA PROVIDED ABOVE** - Never guess or make up numbers
2. When asked "how many contacts/leads/etc" → Count ONLY from the list provided above
3. When asked to "name them" → List ONLY the names from the data above
4. **RESPOND IN THE SAME LANGUAGE AS USER** (English→English, Hindi→Hindi)
5. Be concise and accurate
6. If data shows 4 contacts, say 4 - NOT 6 or any other number
7. The SUMMARY section shows exact counts - USE THOSE NUMBERS`;

      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
      return result.response.text();
    } catch (error) {
      // Handle rate limit - retry after delay
      if (error.message && error.message.includes('429')) {
        const waitMatch = error.message.match(/retry in (\d+)/i);
        const waitTime = waitMatch ? parseInt(waitMatch[1]) : 30;
        return `⏳ API limit reached. Please wait ${waitTime} seconds and try again.\n\nTip: Free tier allows 20 requests/day. For unlimited usage, create a new API key from a different Google account.`;
      }
      console.error('AI Error:', error.message);
      throw error;
    }
  }

  // Helper methods
  async generateEmail({ to, subject, purpose, tone = 'professional' }) {
    const model = this.getModel();
    const result = await model.generateContent(`Write a ${tone} email to ${to} about: ${subject || purpose}. Return only email body.`);
    return { body: result.response.text(), suggestedSubject: subject || purpose };
  }

  async summarizeEntity(entity, entityType = 'lead') {
    const model = this.getModel();
    const result = await model.generateContent(`Summarize this ${entityType} in 3 points: ${JSON.stringify(entity)}`);
    return result.response.text();
  }

  async analyzeEmailSentiment(emailContent) {
    const model = this.getModel();
    const result = await model.generateContent(`Analyze: "${emailContent}". Return JSON: {"sentiment":"positive/negative/neutral","urgency":"high/medium/low"}`);
    const match = result.response.text().match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { sentiment: 'neutral' };
  }

  async getFollowUpSuggestions(entity) {
    const model = this.getModel();
    const result = await model.generateContent(`Suggest 3 follow-ups: ${JSON.stringify(entity)}. Return JSON array.`);
    const match = result.response.text().match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }

  async processVoiceNote(transcription) {
    const model = this.getModel();
    const result = await model.generateContent(`Convert: "${transcription}". Return JSON: {"title":"","content":"","actionItems":[]}`);
    const match = result.response.text().match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { title: 'Note', content: transcription };
  }

  async smartSearch(query) {
    const model = this.getModel();
    const result = await model.generateContent(`Search: "${query}". Return JSON: {"entityType":"","searchText":""}`);
    const match = result.response.text().match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { searchText: query };
  }
}

module.exports = new AIService();
