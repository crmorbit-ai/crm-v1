const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
require('dotenv').config();

/**
 * Script to update subscription plans with proper user limits
 * Free: 5 users
 * Basic: 10 users
 * Premium: 25 users
 * Enterprise: Unlimited (-1)
 */

const planLimits = [
  {
    name: 'Free',
    slug: 'free',
    userLimit: 5,
    displayName: 'Free Plan',
    description: 'Perfect for trying out the platform',
    price: { monthly: 0, yearly: 0 },
    limits: {
      users: 5,
      leads: 100,
      contacts: 100,
      deals: 50,
      storage: 512, // 512 MB
      emailsPerDay: 50
    }
  },
  {
    name: 'Basic',
    slug: 'basic',
    userLimit: 10,
    displayName: 'Basic Plan',
    description: 'Great for small teams',
    price: { monthly: 999, yearly: 9990 },
    limits: {
      users: 10,
      leads: 1000,
      contacts: 1000,
      deals: 200,
      storage: 5120, // 5 GB
      emailsPerDay: 500
    }
  },
  {
    name: 'Professional',
    slug: 'professional',
    userLimit: 25,
    displayName: 'Professional Plan',
    description: 'Best for growing businesses',
    price: { monthly: 2999, yearly: 29990 },
    limits: {
      users: 25,
      leads: 10000,
      contacts: 10000,
      deals: 1000,
      storage: 20480, // 20 GB
      emailsPerDay: 2000
    }
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    userLimit: -1, // Unlimited
    displayName: 'Enterprise Plan',
    description: 'Complete solution for large organizations',
    price: { monthly: 9999, yearly: 99990 },
    limits: {
      users: -1, // Unlimited
      leads: -1, // Unlimited
      contacts: -1, // Unlimited
      deals: -1, // Unlimited
      storage: -1, // Unlimited
      emailsPerDay: -1 // Unlimited
    }
  }
];

const updatePlans = async () => {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 Updating subscription plans...\n');

    for (const planData of planLimits) {
      const existing = await SubscriptionPlan.findOne({ slug: planData.slug });

      if (existing) {
        // Update existing plan
        existing.name = planData.name;
        existing.displayName = planData.displayName;
        existing.description = planData.description;
        existing.price = planData.price;
        existing.limits = planData.limits;
        await existing.save();
        console.log(`✅ Updated ${planData.displayName}: ${planData.limits.users === -1 ? 'Unlimited' : planData.limits.users} users`);
      } else {
        // Create new plan
        const newPlan = await SubscriptionPlan.create({
          name: planData.name,
          slug: planData.slug,
          displayName: planData.displayName,
          description: planData.description,
          price: planData.price,
          trialDays: 15,
          limits: planData.limits,
          features: {
            leadManagement: true,
            contactManagement: true,
            dealTracking: true,
            taskManagement: true,
            emailIntegration: planData.slug !== 'free',
            calendarSync: planData.slug !== 'free',
            advancedReports: planData.slug === 'professional' || planData.slug === 'enterprise',
            customFields: planData.slug === 'professional' || planData.slug === 'enterprise',
            automation: planData.slug === 'professional' || planData.slug === 'enterprise',
            apiAccess: planData.slug === 'professional' || planData.slug === 'enterprise',
            whiteLabeling: planData.slug === 'enterprise',
            dedicatedSupport: planData.slug === 'enterprise',
            customIntegrations: planData.slug === 'enterprise',
            multiCurrency: planData.slug === 'enterprise',
            advancedSecurity: planData.slug === 'enterprise',
            sla: planData.slug === 'enterprise'
          },
          support: planData.slug === 'free' ? 'email' :
                   planData.slug === 'basic' ? 'email' :
                   planData.slug === 'professional' ? 'priority' : 'dedicated',
          isActive: true,
          isPopular: planData.slug === 'professional',
          order: ['free', 'basic', 'professional', 'enterprise'].indexOf(planData.slug)
        });
        console.log(`✅ Created ${planData.displayName}: ${planData.limits.users === -1 ? 'Unlimited' : planData.limits.users} users`);
      }
    }

    console.log('\n✅ All subscription plans updated successfully!');
    console.log('\n📊 Summary:');
    console.log('   Free Plan: 5 users');
    console.log('   Basic Plan: 10 users');
    console.log('   Professional Plan: 25 users');
    console.log('   Enterprise Plan: Unlimited users');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error updating plans:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
updatePlans();
