const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Skip authentication for certain paths
  const publicPaths = ['/api/v1/auth/csrf-token', '/api/v1/auth/signin', '/api/v1/auth/signup'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};