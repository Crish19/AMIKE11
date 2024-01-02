// emailConfig.js

const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service provider
  auth: {
    user: 'amiketours@gmail.com', // Your email address
    pass: 'Elchavodelocho', // Your email password or an app-specific password
  },
});

module.exports = transporter;
