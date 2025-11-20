require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Role = require('../models/Role');
const Feature = require('../models/Feature');
const Subscription = require('../models/Subscription');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data (be careful in production!)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Role.deleteMany({});
    await Feature.deleteMany({});
    await Subscription.deleteMany({});

    // 1. Create SAAS Owner
    console.log('Creating SAAS owner...');
    const saasOwner = await User.create({
      email: process.env.SAAS_OWNER_EMAIL || 'admin@saasplatform.com',
      password: process.env.SAAS_OWNER_PASSWORD || 'admin123',
      firstName: 'Super',
      lastName: 'Admin',
      userType: 'SAAS_OWNER',
      isActive: true
    });
    console.log(`✓ SAAS Owner created: ${saasOwner.email}`);

    // 2. Create Features
    console.log('Creating features...');
    const features = await Feature.create([
      {
        name: 'User Management',
        slug: 'user_management',
        description: 'Create, read, update, and delete users',
        category: 'core',
        availableActions: ['create', 'read', 'update', 'delete', 'manage'],
        availableInPlans: ['free', 'basic', 'premium', 'enterprise'],
        isDefaultEnabled: true,
        isCoreFeature: true
      },
      {
        name: 'Role Management',
        slug: 'role_management',
        description: 'Manage roles and permissions',
        category: 'core',
        availableActions: ['create', 'read', 'update', 'delete', 'manage'],
        availableInPlans: ['basic', 'premium', 'enterprise'],
        isDefaultEnabled: true,
        isCoreFeature: true
      },
      {
        name: 'Group Management',
        slug: 'group_management',
        description: 'Organize users into groups',
        category: 'core',
        availableActions: ['create', 'read', 'update', 'delete', 'manage'],
        availableInPlans: ['basic', 'premium', 'enterprise'],
        isDefaultEnabled: true,
        isCoreFeature: false
      },
      {
        name: 'Advanced Analytics',
        slug: 'advanced_analytics',
        description: 'Detailed analytics and reporting',
        category: 'analytics',
        availableActions: ['read'],
        availableInPlans: ['premium', 'enterprise'],
        isDefaultEnabled: false,
        isCoreFeature: false
      },
      {
        name: 'API Access',
        slug: 'api_access',
        description: 'Programmatic API access',
        category: 'integration',
        availableActions: ['read', 'manage'],
        availableInPlans: ['premium', 'enterprise'],
        isDefaultEnabled: false,
        isCoreFeature: false
      }
    ]);
    console.log(`✓ Created ${features.length} features`);

    // 3. Create System Roles
    console.log('Creating system roles...');
    const systemRoles = await Role.create([
      {
        name: 'Super Admin',
        slug: 'super-admin',
        description: 'Full access to all features',
        tenant: null,
        roleType: 'system',
        permissions: [
          { feature: 'user_management', actions: ['manage'] },
          { feature: 'role_management', actions: ['manage'] },
          { feature: 'group_management', actions: ['manage'] }
        ],
        level: 100
      },
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Can manage users and basic settings',
        tenant: null,
        roleType: 'system',
        permissions: [
          { feature: 'user_management', actions: ['create', 'read', 'update', 'delete'] },
          { feature: 'role_management', actions: ['read'] },
          { feature: 'group_management', actions: ['create', 'read', 'update', 'delete'] }
        ],
        level: 50
      },
      {
        name: 'Manager',
        slug: 'manager',
        description: 'Can manage users in their groups',
        tenant: null,
        roleType: 'system',
        permissions: [
          { feature: 'user_management', actions: ['read', 'update'] },
          { feature: 'group_management', actions: ['read'] }
        ],
        level: 30
      },
      {
        name: 'User',
        slug: 'user',
        description: 'Basic user with read access',
        tenant: null,
        roleType: 'system',
        permissions: [
          { feature: 'user_management', actions: ['read'] }
        ],
        level: 10
      }
    ]);
    console.log(`✓ Created ${systemRoles.length} system roles`);

    // 4. Create Demo Tenant
    console.log('Creating demo tenant...');
    const demoTenant = await Tenant.create({
      organizationName: 'Demo Company Inc',
      slug: 'demo-company',
      contactEmail: 'contact@democompany.com',
      contactPhone: '+1 234 567 8900',
      address: {
        street: '123 Demo Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94102'
      },
      planType: 'premium',
      theme: {
        primaryColor: '#2196f3',
        secondaryColor: '#ff5722',
        companyName: 'Demo Company'
      },
      isActive: true
    });
    console.log(`✓ Demo tenant created: ${demoTenant.organizationName}`);

    // 5. Create Demo Subscription
    console.log('Creating demo subscription...');
    const demoSubscription = await Subscription.create({
      tenant: demoTenant._id,
      planType: 'premium',
      status: 'active',
      pricing: {
        amount: 99,
        currency: 'USD',
        billingCycle: 'monthly'
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      limits: {
        maxUsers: 50,
        maxStorage: 10240,
        maxProjects: 20,
        maxApiCalls: 10000
      },
      currentUsage: {
        users: 2,
        storage: 100,
        projects: 0,
        apiCalls: 0
      }
    });
    demoTenant.subscription = demoSubscription._id;
    await demoTenant.save();
    console.log('✓ Demo subscription created');

    // 6. Create Demo Tenant Admin
    console.log('Creating demo tenant admin...');
    const demoAdmin = await User.create({
      email: 'admin@democompany.com',
      password: 'demo123',
      firstName: 'John',
      lastName: 'Doe',
      userType: 'TENANT_ADMIN',
      tenant: demoTenant._id,
      roles: [systemRoles[0]._id], // Super Admin role
      isActive: true
    });
    console.log(`✓ Demo admin created: ${demoAdmin.email}`);

    // 7. Create Demo Users
    console.log('Creating demo users...');
    const demoUsers = await User.create([
      {
        email: 'jane.manager@democompany.com',
        password: 'demo123',
        firstName: 'Jane',
        lastName: 'Smith',
        userType: 'TENANT_MANAGER',
        tenant: demoTenant._id,
        roles: [systemRoles[2]._id], // Manager role
        isActive: true
      },
      {
        email: 'bob.user@democompany.com',
        password: 'demo123',
        firstName: 'Bob',
        lastName: 'Johnson',
        userType: 'TENANT_USER',
        tenant: demoTenant._id,
        roles: [systemRoles[3]._id], // User role
        isActive: true
      }
    ]);
    console.log(`✓ Created ${demoUsers.length} demo users`);

    // Summary
    console.log('\n========================================');
    console.log('Database seeded successfully! 🎉');
    console.log('========================================\n');

    console.log('SAAS Owner Account:');
    console.log(`  Email: ${saasOwner.email}`);
    console.log(`  Password: ${process.env.SAAS_OWNER_PASSWORD || 'admin123'}`);
    console.log(`  Dashboard: http://localhost:3000/saas/dashboard\n`);

    console.log('Demo Tenant Admin:');
    console.log(`  Email: ${demoAdmin.email}`);
    console.log(`  Password: demo123`);
    console.log(`  Organization: ${demoTenant.organizationName}`);
    console.log(`  Dashboard: http://localhost:3000/dashboard\n`);

    console.log('Other Demo Users:');
    demoUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.userType})`);
    });

    console.log('\n========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
