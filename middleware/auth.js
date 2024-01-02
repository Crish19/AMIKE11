const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Authorization header:', req.header('Authorization'));

    const token = req.header('Authorization').replace('Bearer ', '');
    console.log('Extracted Token:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);

    const user = await User.findOne({ _id: decoded.userId });
    console.log('Found User:', user);


    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);

    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = auth;
