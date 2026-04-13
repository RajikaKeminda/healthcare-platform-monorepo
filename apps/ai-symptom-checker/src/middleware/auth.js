const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'healthcare_jwt_secret_2026');
      req.user = decoded;
    } catch (error) {
      // Optional auth - continue without user
    }
  }
  next();
};

module.exports = { optionalAuth };
