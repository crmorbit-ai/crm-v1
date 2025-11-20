require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionPlan = require("./src/models/SubscriptionPlan");


const defaultPlans = [
  {
    name: 'Free',
    slug: 'free',
    displayName: 'Free Plan',
    description: 'Perfect for getting started',
    price: {
      monthly: 0,
      yearly: 0
    },
    trialDays: 15,
    limits: {
      users: 5,
      leads: 1000,
      contacts: 1000,
      deals: 100,
      storage: 1024, // 1GB
      emailsPerDay: 50
    },
    features: {
      leadManagement: true,
      contactManagement: true,
      dealTracking: true,
      taskManagement: true,
      emailIntegration: false,
      calendarSync: false,
      advancedReports: false,
      customFields: false,
      automation: false,
      apiAccess: false,
      whiteLabeling: false,
      dedicatedSupport: false,
      customIntegrations: false,
      multiCurrency: false,
      advancedSecurity: false,
      sla: false
    },
    support: 'email',
    isActive: true,
    isPopular: false,
    order: 1
  },
  {
    name: 'Basic',
    slug: 'basic',
    displayName: 'Basic Plan',
    description: 'Great for small teams',
    price: {
      monthly: 999,
      yearly: 9990 // 2 months free
    },
    trialDays: 15,
    limits: {
      users: 10,
      leads: 5000,
      contacts: 5000,
      deals: 500,
      storage: 5120, // 5GB
      emailsPerDay: 200
    },
    features: {
      leadManagement: true,
      contactManagement: true,
      dealTracking: true,
      taskManagement: true,
      emailIntegration: true,
      calendarSync: true,
      advancedReports: false,
      customFields: true,
      automation: false,
      apiAccess: false,
      whiteLabeling: false,
      dedicatedSupport: false,
      customIntegrations: false,
      multiCurrency: false,
      advancedSecurity: false,
      sla: false
    },
    support: 'priority',
    isActive: true,
    isPopular: false,
    order: 2
  },
  {
    name: 'Professional',
    slug: 'professional',
    displayName: 'Professional Plan',
    description: 'Best for growing businesses',
    price: {
      monthly: 2999,
      yearly: 29990 // 3 months free
    },
    trialDays: 15,
    limits: {
      users: 25,
      leads: -1, // Unlimited
      contacts: -1,
      deals: -1,
      storage: 20480, // 20GB
      emailsPerDay: 1000
    },
    features: {
      leadManagement: true,
      contactManagement: true,
      dealTracking: true,
      taskManagement: true,
      emailIntegration: true,
      calendarSync: true,
      advancedReports: true,
      customFields: true,
      automation: true,
      apiAccess: true,
      whiteLabeling: false,
      dedicatedSupport: false,
      customIntegrations: false,
      multiCurrency: true,
      advancedSecurity: true,
      sla: false
    },
    support: 'priority',
    isActive: true,
    isPopular: true,
    order: 3
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    displayName: 'Enterprise Plan',
    description: 'For large organizations',
    price: {
      monthly: 9999,
      yearly: 99990 // 4 months free
    },
    trialDays: 30,
    limits: {
      users: -1, // Unlimited
      leads: -1,
      contacts: -1,
      deals: -1,
      storage: -1, // Unlimited
      emailsPerDay: -1
    },
    features: {
      leadManagement: true,
      contactManagement: true,
      dealTracking: true,
      taskManagement: true,
      emailIntegration: true,
      calendarSync: true,
      advancedReports: true,
      customFields: true,
      automation: true,
      apiAccess: true,
      whiteLabeling: true,
      dedicatedSupport: true,
      customIntegrations: true,
      multiCurrency: true,
      advancedSecurity: true,
      sla: true
    },
    support: '24x7',
    isActive: true,
    isPopular: false,
    order: 4
  }
];

const seedPlans = async () => {
  try {
    console.log('🌱 Starting subscription plans seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('🗑️  Cleared existing plans');

    // Insert new plans
    const createdPlans = await SubscriptionPlan.insertMany(defaultPlans);
    console.log(`✅ Created ${createdPlans.length} subscription plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`   - ${plan.name}: ₹${plan.price.monthly}/month`);
    });

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedPlans();