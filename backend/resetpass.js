const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/teamtaskmanager').then(async () => {
  const user = await User.findOne({ email: 'uday@gmail.com' });
  user.password = 'Uday@1234';
  await user.save();
  console.log('Uday password reset successfully to Uday@1234');
  process.exit();
});