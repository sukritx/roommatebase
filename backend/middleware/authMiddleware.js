const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Skip authentication for certain paths
  const publicPaths = [
    '/api/auth/csrf-token',
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/rooms' // GET requests to view rooms are public
  ];

  if (publicPaths.includes(req.path) || (req.path === '/api/rooms' && req.method === 'GET')) {
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

module.exports = authenticateToken;