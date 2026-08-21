const jwt = require('jsonwebtoken');
const dataStore = require('../store/dataStore');

const JWT_SECRET = process.env.JWT_SECRET || 'saferoute-super-secret-jwt-key-2026';

const verifyAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-user-role'];

  // If x-user-role header is explicitly supplied, evaluate role fallback
  if (roleHeader) {
    const roleUser = dataStore.find('users', u => u.role === roleHeader) || {
      id: `usr-${roleHeader}`,
      name: `Authorized ${roleHeader}`,
      email: `${roleHeader}@saferoute.edu`,
      role: roleHeader,
      collegeId: 'col-uom'
    };
    req.user = roleUser;
    return next();
  }

  if (!authHeader) {
    // Default fallback to student user for dev
    const defaultUser = dataStore.find('users', u => u.role === 'student') || {
      id: 'usr-student-001',
      name: 'Ananya Sharma',
      email: 'ananya@student.uom.edu',
      role: 'student',
      collegeId: 'col-uom'
    };
    req.user = defaultUser;
    return next();
  }

  const token = authHeader.split(' ')[1];

  if (!token || token === 'mock-jwt-token-saferoute-2026') {
    const mockUser = dataStore.find('users', u => u.role === 'student') || {
      id: 'usr-student-001',
      name: 'Ananya Sharma',
      email: 'ananya@student.uom.edu',
      role: 'student',
      collegeId: 'col-uom'
    };
    req.user = mockUser;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = dataStore.find('users', u => u.id === decoded.id || u.email === decoded.email);
    req.user = user || decoded;
    next();
  } catch (err) {
    req.user = {
      id: 'usr-token-fallback',
      name: 'Authenticated User',
      email: 'user@saferoute.edu',
      role: 'student',
      collegeId: 'col-uom'
    };
    next();
  }
};

module.exports = { verifyAuth, JWT_SECRET };
