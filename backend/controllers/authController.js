const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dataStore = require('../store/dataStore');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { ROLE_PERMISSIONS } = require('../middleware/rbacMiddleware');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, collegeId, campusId, emergencyContacts } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
    }

    const existing = dataStore.find('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role || 'student';
    const newUserId = `usr-${Date.now()}`;

    const college = dataStore.find('colleges', c => c.id === collegeId) || dataStore.get('colleges')[0];

    const newUser = {
      id: newUserId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || '',
      role: userRole,
      collegeId: college ? college.id : 'col-uom',
      collegeName: college ? college.name : 'University of Mumbai',
      campusId: campusId || (college && college.campuses ? college.campuses[0]?.id : 'camp-uom-fort'),
      createdAt: new Date().toISOString()
    };

    dataStore.push('users', newUser);

    // Save emergency contacts if provided
    if (Array.isArray(emergencyContacts) && emergencyContacts.length > 0) {
      emergencyContacts.forEach((cnt, idx) => {
        dataStore.push('contacts', {
          id: `cnt-${Date.now()}-${idx}`,
          userId: newUserId,
          name: cnt.name,
          phone: cnt.phone,
          relation: cnt.relation || 'Emergency Contact',
          isPrimary: idx === 0
        });
      });
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, collegeId: newUser.collegeId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const permissions = ROLE_PERMISSIONS[userRole] || [];

    // Return response sanitized (without passwordHash)
    const { passwordHash: _, ...userSanitized } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: userSanitized,
      permissions
    });
  } catch (err) {
    console.error('[AuthController.register] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    let user = dataStore.find('users', u => u.email.toLowerCase() === email.toLowerCase());

    // Dev fallback if password is provided or matching role
    if (!user && (email.includes('saferoute') || email.includes('student') || role)) {
      const requestedRole = role || 'student';
      user = dataStore.find('users', u => u.role === requestedRole) || dataStore.get('users')[0];
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Verify password if provided and user has passwordHash
    if (password && user.passwordHash && !user.passwordHash.includes('MockPassword')) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, collegeId: user.collegeId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userContacts = dataStore.filter('contacts', c => c.userId === user.id);
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    const { passwordHash: _, ...userSanitized } = user;

    res.json({
      success: true,
      token,
      user: userSanitized,
      contacts: userContacts,
      permissions
    });
  } catch (err) {
    console.error('[AuthController.login] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
};

const getProfile = (req, res) => {
  const userId = req.user?.id;
  const user = dataStore.find('users', u => u.id === userId) || req.user;
  const userContacts = dataStore.filter('contacts', c => c.userId === userId || c.userId === 'usr-student-001');
  const permissions = ROLE_PERMISSIONS[user.role || 'student'] || [];

  const { passwordHash: _, ...userSanitized } = user;
  res.json({
    success: true,
    user: userSanitized,
    contacts: userContacts,
    permissions
  });
};

const updateProfile = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const { name, phone, homeAddress, collegeId, campusId } = req.body;

  const updated = dataStore.update(
    'users',
    u => u.id === userId,
    u => ({
      ...u,
      name: name || u.name,
      phone: phone || u.phone,
      homeAddress: homeAddress || u.homeAddress,
      collegeId: collegeId || u.collegeId,
      campusId: campusId || u.campusId
    })
  );

  if (!updated) {
    return res.status(404).json({ success: false, message: 'User profile not found' });
  }

  const { passwordHash: _, ...userSanitized } = updated;
  res.json({ success: true, message: 'Profile updated successfully', user: userSanitized });
};

const getEmergencyContacts = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const userContacts = dataStore.filter('contacts', c => c.userId === userId || c.userId === 'usr-student-001');
  res.json({ success: true, count: userContacts.length, contacts: userContacts });
};

const addEmergencyContact = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const { name, phone, relation, isPrimary } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone number are required' });
  }

  const newContact = {
    id: `cnt-${Date.now()}`,
    userId,
    name,
    phone,
    relation: relation || 'Emergency Contact',
    isPrimary: !!isPrimary
  };

  dataStore.push('contacts', newContact);
  res.status(201).json({ success: true, message: 'Emergency contact added', contact: newContact });
};

const removeEmergencyContact = (req, res) => {
  const { id } = req.params;
  dataStore.delete('contacts', c => c.id === id);
  res.json({ success: true, message: 'Emergency contact removed successfully' });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact
};
