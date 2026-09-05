const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-hackathon-secret';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, roles: user.roles, employee_id: user.employee_id },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    req.user.rolesArr = (req.user.roles || '').split(',').map(r => r.trim()).filter(Boolean);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    const roles = req.user?.rolesArr || [];
    if (roles.includes('HR Payroll Admin') || roles.some(r => allowed.includes(r))) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient permissions for this action' });
  };
}

module.exports = { signToken, authRequired, requireRole, JWT_SECRET };
