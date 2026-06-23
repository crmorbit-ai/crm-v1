const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const User = require('./src/models/User');

    const users = await User.find({
      firstName: /Prachi/i
    }).select('firstName lastName email loginName userType');

    console.log('Found', users.length, 'user(s) with name Prachi:\n');

    users.forEach((u, i) => {
      console.log((i+1) + '. ' + u.firstName + ' ' + u.lastName);
      console.log('   Email:', u.email || 'NOT SET');
      console.log('   LoginName:', u.loginName || 'NOT SET');
      console.log('   UserType:', u.userType);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
