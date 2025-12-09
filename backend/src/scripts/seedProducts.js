const mongoose = require('mongoose');
require('dotenv').config();
const { connectDataCenterDB } = require('../config/database');

const seedProducts = async () => {
  try {
    console.log('🚀 Connecting to Data Center Database...');
    const connection = await connectDataCenterDB();

    if (!connection) {
      console.error('❌ Failed to connect to Data Center database');
      process.exit(1);
    }

    const Product = connection.model('Product');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Define products
    const products = [
      {
        name: 'email',
        displayName: 'Email Communication',
        description: 'Send bulk emails to DataCenter candidates',
        icon: '📧',
        type: 'email',
        pricing: {
          pricePerUnit: 0.5,
          currency: 'INR',
          unit: 'email',
        },
        packages: [
          {
            credits: 1000,
            price: 450,
            discount: 10,
            isPopular: false,
          },
          {
            credits: 5000,
            price: 2000,
            discount: 20,
            isPopular: true,
          },
          {
            credits: 10000,
            price: 3500,
            discount: 30,
            isPopular: false,
          },
        ],
        features: {
          bulkEnabled: true,
          apiAccess: true,
          analytics: true,
        },
        isActive: true,
        order: 1,
      },
      {
        name: 'whatsapp',
        displayName: 'WhatsApp Messages',
        description: 'Send bulk WhatsApp messages to candidates',
        icon: '💬',
        type: 'whatsapp',
        pricing: {
          pricePerUnit: 1,
          currency: 'INR',
          unit: 'message',
        },
        packages: [
          {
            credits: 500,
            price: 450,
            discount: 10,
            isPopular: false,
          },
          {
            credits: 2000,
            price: 1600,
            discount: 20,
            isPopular: true,
          },
          {
            credits: 5000,
            price: 3500,
            discount: 30,
            isPopular: false,
          },
        ],
        features: {
          bulkEnabled: true,
          apiAccess: true,
          analytics: true,
        },
        isActive: true,
        order: 2,
      },
      {
        name: 'sms',
        displayName: 'SMS Messages',
        description: 'Send bulk SMS to candidates',
        icon: '📱',
        type: 'sms',
        pricing: {
          pricePerUnit: 0.25,
          currency: 'INR',
          unit: 'SMS',
        },
        packages: [
          {
            credits: 1000,
            price: 225,
            discount: 10,
            isPopular: false,
          },
          {
            credits: 5000,
            price: 1000,
            discount: 20,
            isPopular: true,
          },
          {
            credits: 10000,
            price: 1750,
            discount: 30,
            isPopular: false,
          },
        ],
        features: {
          bulkEnabled: true,
          apiAccess: true,
          analytics: true,
        },
        isActive: true,
        order: 3,
      },
      {
        name: 'call',
        displayName: 'Call Minutes',
        description: 'Automated calling to candidates',
        icon: '📞',
        type: 'call',
        pricing: {
          pricePerUnit: 1,
          currency: 'INR',
          unit: 'minute',
        },
        packages: [
          {
            credits: 100,
            price: 90,
            discount: 10,
            isPopular: false,
          },
          {
            credits: 500,
            price: 400,
            discount: 20,
            isPopular: true,
          },
          {
            credits: 1000,
            price: 700,
            discount: 30,
            isPopular: false,
          },
        ],
        features: {
          bulkEnabled: true,
          apiAccess: false,
          analytics: true,
        },
        isActive: true,
        order: 4,
      },
    ];

    // Insert products
    await Product.insertMany(products);
    console.log('✅ Successfully seeded products:');
    products.forEach((product) => {
      console.log(`   - ${product.displayName}: ${product.pricing.currency} ${product.pricing.pricePerUnit} per ${product.pricing.unit}`);
    });

    console.log('\n🎉 Products seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

// Run the seed
seedProducts();
