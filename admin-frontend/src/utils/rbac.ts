export type UserRole = 'student' | 'college_authority' | 'security_team' | 'super_admin';

export type Permission =
  // Student / User Permissions
  | 'report_incident'
  | 'anonymous_reporting'
  | 'view_safety_map'
  | 'receive_alerts'
  | 'trigger_sos'
  | 'track_own_reports'

  // College Authority Permissions
  | 'view_reports'
  | 'verify_reports'
  | 'monitor_incidents'
  | 'assign_actions'
  | 'update_status'

  // Security Team Permissions
  | 'view_assigned_incidents'
  | 'respond_to_incidents'
  | 'update_response_status'
  | 'mark_resolved'

  // Super Admin Permissions
  | 'manage_colleges'
  | 'manage_users'
  | 'manage_authorities'
  | 'monitor_system'
  | 'manage_risk_zones';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    'report_incident',
    'anonymous_reporting',
    'view_safety_map',
    'receive_alerts',
    'trigger_sos',
    'track_own_reports',
  ],
  college_authority: [
    'view_reports',
    'verify_reports',
    'monitor_incidents',
    'assign_actions',
    'update_status',
    'view_safety_map',
    'receive_alerts',
    'track_own_reports',
  ],
  security_team: [
    'view_assigned_incidents',
    'respond_to_incidents',
    'update_response_status',
    'mark_resolved',
    'view_reports',
    'view_safety_map',
    'receive_alerts',
  ],
  super_admin: [
    'manage_colleges',
    'manage_users',
    'manage_authorities',
    'monitor_system',
    'manage_risk_zones',
    'view_reports',
    'verify_reports',
    'monitor_incidents',
    'assign_actions',
    'update_status',
    'view_assigned_incidents',
    'respond_to_incidents',
    'update_response_status',
    'mark_resolved',
    'report_incident',
    'anonymous_reporting',
    'view_safety_map',
    'receive_alerts',
    'trigger_sos',
    'track_own_reports',
  ],
};

export const ROLE_DETAILS: Record<UserRole, { label: string; description: string; color: string; icon: string }> = {
  student: {
    label: 'Student / User',
    description: 'Report incidents, access live safety map, trigger SOS & receive real-time alerts.',
    color: '#3B82F6',
    icon: 'user-graduate',
  },
  college_authority: {
    label: 'College Authority',
    description: 'Inspect incident reports, verify authenticity, assign security teams & update statuses.',
    color: '#8B5CF6',
    icon: 'user-shield',
  },
  security_team: {
    label: 'Security Patrol Team',
    description: 'Receive assigned incidents, respond on-scene, update response notes & mark cases resolved.',
    color: '#F59E0B',
    icon: 'shield-alt',
  },
  super_admin: {
    label: 'Super Admin',
    description: 'Full system authority. Manage universities, users, security authorities & risk zones.',
    color: '#EF4444',
    icon: 'crown',
  },
};

/**
 * Frontend Permission Guard: Check if a user's role grants a specific permission.
 */
export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Route Access Protection Guard.
 */
export function canAccessRoute(role: UserRole | undefined | null, routePath: string): boolean {
  const userRole = role || 'student';

  if (routePath.includes('authority-dashboard')) {
    return (
      hasPermission(userRole, 'view_reports') ||
      hasPermission(userRole, 'view_assigned_incidents') ||
      hasPermission(userRole, 'manage_colleges')
    );
  }

  if (routePath.includes('report-incident')) {
    return hasPermission(userRole, 'report_incident');
  }

  if (routePath.includes('alerts')) {
    return hasPermission(userRole, 'receive_alerts');
  }

  // Public/Student routes (map, index, contacts, settings)
  return true;
}

/**
 * Simulated Backend API Route Protection Guard.
 * Simulates server-side authorization enforcement for API endpoints.
 */
export async function protectApiCall<T>(
  userRole: UserRole | undefined | null,
  requiredPermission: Permission,
  apiHandler: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; statusCode: number }> {
  if (!hasPermission(userRole, requiredPermission)) {
    return {
      success: false,
      error: `403 Forbidden: Role '${userRole || 'unauthenticated'}' is unauthorized to perform action '${requiredPermission}'.`,
      statusCode: 403,
    };
  }

  try {
    const data = await apiHandler();
    return { success: true, data, statusCode: 200 };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || '500 Internal Server Error',
      statusCode: 500,
    };
  }
}
