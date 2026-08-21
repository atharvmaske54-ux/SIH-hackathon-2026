import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import { UserRole, ROLE_DETAILS, ROLE_PERMISSIONS } from '../../utils/rbac';

export default function SettingsScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { user, switchUserRole } = useAppContext();
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [autoRecord, setAutoRecord] = useState(false);

  const activeRole: UserRole = user?.role || 'student';
  const roleMeta = ROLE_DETAILS[activeRole] || ROLE_DETAILS.student;
  const activePermissions = ROLE_PERMISSIONS[activeRole] || [];

  const handleRoleChange = async (newRole: UserRole) => {
    await switchUserRole(newRole);
    Alert.alert('Role Updated', `Switched active role to "${ROLE_DETAILS[newRole].label}".`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Info Header */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: roleMeta.color + '20' }]}>
            <Text style={[styles.avatarText, { color: roleMeta.color }]}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'J'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editPhotoBadge} onPress={() => Alert.alert('Edit Photo', 'Choose a new profile picture.')}>
            <FontAwesome5 name="camera" size={12} color={Colors.white} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.nameRow}>
          <Text style={styles.profileName}>{user?.name || 'Jane Doe'}</Text>
          <TouchableOpacity onPress={() => Alert.alert('Edit Name', 'Enter your new name.')}>
            <FontAwesome5 name="pen" size={14} color={Colors.primary} style={styles.editIcon} />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileEmail}>{user?.email || 'jane.doe@example.com'}</Text>

        {/* Active Role Badge Indicator */}
        <View style={[styles.activeRoleBadge, { backgroundColor: roleMeta.color + '15', borderColor: roleMeta.color }]}>
          <FontAwesome5 name={roleMeta.icon} size={12} color={roleMeta.color} style={{ marginRight: 6 }} />
          <Text style={[styles.activeRoleBadgeText, { color: roleMeta.color }]}>
            Role: {roleMeta.label}
          </Text>
        </View>
      </View>

      {/* ROLE-BASED ACCESS CONTROL (RBAC) SWITCHER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Role-Based Access Control (RBAC)</Text>
        <Text style={styles.sectionSub}>Select an active role to test permission levels and UI views:</Text>

        <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 10 }}>
          {(['student', 'college_authority', 'security_team', 'super_admin'] as UserRole[]).map(roleKey => {
            const meta = ROLE_DETAILS[roleKey];
            const isSelected = activeRole === roleKey;
            return (
              <TouchableOpacity
                key={roleKey}
                style={[
                  styles.roleSelectCard,
                  isSelected && { borderColor: meta.color, backgroundColor: meta.color + '10' }
                ]}
                onPress={() => handleRoleChange(roleKey)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.roleIconCircle, { backgroundColor: meta.color + '20' }]}>
                    <FontAwesome5 name={meta.icon} size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.roleSelectTitle}>{meta.label}</Text>
                      {isSelected && (
                        <View style={[styles.activeCheckPill, { backgroundColor: meta.color }]}>
                          <Text style={styles.activeCheckText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.roleSelectDesc}>{meta.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Granted Permissions Summary */}
        <View style={styles.permissionsSummaryBox}>
          <Text style={styles.permTitle}>Granted Permissions ({activePermissions.length}):</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {activePermissions.map(perm => (
              <View key={perm} style={styles.permChip}>
                <Text style={styles.permChipText}>✓ {perm}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Permissions</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <FontAwesome5 name="map-marker-alt" size={20} color={Colors.primary} style={styles.settingIcon} />
            <Text style={styles.settingText}>Location Access</Text>
          </View>
          <Switch 
            value={locationEnabled} 
            onValueChange={setLocationEnabled}
            trackColor={{ false: Colors.border, true: Colors.safe }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <FontAwesome5 name="microphone" size={20} color={Colors.primary} style={styles.settingIcon} />
            <Text style={styles.settingText}>Microphone Access</Text>
          </View>
          <Switch 
            value={micEnabled} 
            onValueChange={setMicEnabled}
            trackColor={{ false: Colors.border, true: Colors.safe }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <FontAwesome5 name="sms" size={20} color={Colors.primary} style={styles.settingIcon} />
            <Text style={styles.settingText}>Send SMS Alerts</Text>
          </View>
          <Switch 
            value={smsEnabled} 
            onValueChange={setSmsEnabled}
            trackColor={{ false: Colors.border, true: Colors.safe }}
          />
        </View>
      </View>

      {/* Authority Portal Link */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Institutional Authority Portal</Text>
        
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => router.push('/authority-dashboard' as any)}
        >
          <View style={styles.settingInfo}>
            <FontAwesome5 name="user-shield" size={20} color={Colors.primary} style={styles.settingIcon} />
            <View>
              <Text style={styles.settingText}>Authority & Security Dashboard</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                Access role-protected monitoring, response & administration
              </Text>
            </View>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutBtn}
        onPress={() => router.replace('/auth/login')}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editIcon: {
    marginLeft: 8,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  activeRoleBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 16,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 16,
    marginBottom: 10,
  },
  roleSelectCard: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleSelectTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
  },
  roleSelectDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  activeCheckPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeCheckText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.white,
  },
  permissionsSummaryBox: {
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  permTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  permChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  permChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 24,
    marginRight: 12,
  },
  settingText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  logoutBtn: {
    margin: 20,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
