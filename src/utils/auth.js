const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'faas-events-dev-secret-2024';

module.exports = {
  generateToken: (userId, email, role = 'user') => {
    return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '24h' });
  },

  verifyToken: (token) => {
    return jwt.verify(token, JWT_SECRET);
  },
};