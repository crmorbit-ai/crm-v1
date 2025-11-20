const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
require('dotenv').config();

async function checkRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all roles
    const roles = await Role.find({});
    console.log(`Found ${roles.length} role(s):\n`);

    roles.forEach(role => {
      console.log(`Role: ${role.name}`);
      console.log(`  Slug: ${role.slug}`);
      console.log(`  Type: ${role.roleType}`);
      console.log(`  Permissions: ${role.permissions.length} feature(s)`);
      role.permissions.forEach(perm => {
        console.log(`    - ${perm.feature}: [${perm.actions.join(', ')}]`);
      });
      console.log('');
    });

    // Find current user
    const users = await User.find({}).populate('roles');
    console.log(`\nFound ${users.length} user(s):\n`);

    users.forEach(user => {
      console.log(`User: ${user.email} (${user.userType})`);
      console.log(`  Roles: ${user.roles.map(r => r.name).join(', ') || 'None'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkRoles();
