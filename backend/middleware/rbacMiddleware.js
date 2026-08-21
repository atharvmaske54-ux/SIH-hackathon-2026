const ROLE_PERMISSIONS = {
  student: [
    'report_incident',
    'anonymous_reporting',
    'view_safety_map',
    'receive_alerts',
    'trigger_sos',
    'track_own_reports',
    'manage_contacts',
    'schedule_fake_call',
    'start_companion'
  ],
  college_authority: [
    'view_reports',
    'verify_reports',
    'monitor_incidents',
    'assign_actions',
    'update_status',
    'broadcast_alerts'
  ],
  security_team: [
    'view_assigned_incidents',
    'respond_to_incidents',
    'update_response_status',
    'mark_resolved',
    'receive_sos_alerts'
  ],
  super_admin: [
    'manage_colleges',
    'manage_users',
    'manage_authorities',
    'monitor_system',
    'manage_risk_zones',
    'broadcast_alerts'
  ]
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'student';
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (userRole === 'super_admin' || permissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: `Role '${userRole}' lacks required permission '${requiredPermission}'`
    });
  };
};

module.exports = { checkPermission, ROLE_PERMISSIONS };
