import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAppContext } from '../context/AppContext';
import { UserRole, ROLE_DETAILS } from '../utils/rbac';
import AuthorityDashboardScreen from './authority-dashboard';

export default function AdminDashboardIndex() {
  const router = useRouter();
  const { isAdminAuthenticated, loginAdmin } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('college_authority');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated) {
      router.replace('/authority-dashboard');
    }
  }, [isAdminAuthenticated]);

  if (isAdminAuthenticated) {
    return <AuthorityDashboardScreen />;
  }

  const handleLogin = async (overrideEmail?: string, overrideRole?: UserRole) => {
    const targetEmail = overrideEmail || email;
    const targetRole = overrideRole || selectedRole;

    if (!targetEmail.trim() && !overrideEmail) {
      Alert.alert('Email Required', 'Please enter your official administrator email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin(targetEmail.trim(), password, targetRole);
      setLoading(false);
      if (res.success) {
        router.replace('/authority-dashboard');
      } else {
        Alert.alert('Authentication Failed', res.message);
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Unable to complete sign in. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.authWrapper}>
        {/* Header Shield Branding */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <FontAwesome5 name="shield-alt" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.brandTitle}>SafeRoute Enterprise</Text>
          <Text style={styles.brandSub}>Campus Authority & Security Command Portal</Text>
        </View>

        {/* Authentication Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔑 Administrator Sign In</Text>
          <Text style={styles.cardDesc}>
            Enter your credentials to access live incident monitoring, security squad dispatch, and campus safety analytics.
          </Text>

          {/* Role Selection */}
          <Text style={styles.label}>Select Administrative Authority Role</Text>
          <View style={styles.roleGrid}>
            {(['college_authority', 'security_team', 'super_admin'] as UserRole[]).map(roleKey => {
              const meta = ROLE_DETAILS[roleKey];
              const isSelected = selectedRole === roleKey;
              return (
                <TouchableOpacity
                  key={roleKey}
                  style={[
                    styles.roleCard,
                    isSelected && { borderColor: meta.color, backgroundColor: meta.color + '15' },
                  ]}
                  onPress={() => setSelectedRole(roleKey)}
                >
                  <FontAwesome5 name={meta.icon} size={16} color={isSelected ? meta.color : Colors.textSecondary} />
                  <Text style={[styles.roleCardText, isSelected && { color: meta.color, fontWeight: '700' }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Email Input */}
          <Text style={styles.label}>Official Email Address</Text>
          <View style={styles.inputContainer}>
            <FontAwesome5 name="envelope" size={14} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. cso@uom.edu or admin@saferoute.org"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Security Passcode Input */}
          <Text style={styles.label}>Security Passcode / Password</Text>
          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={14} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter security passcode"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <FontAwesome5 name="sign-in-alt" size={16} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.loginBtnText}>Sign In to Admin Console</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Quick Demo Sign In Presets */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>QUICK DEMO ACCESSIBILITY</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.quickPresetContainer}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleLogin('cso@uom.edu', undefined, 'college_authority')}
            >
              <FontAwesome5 name="user-shield" size={13} color="#3B82F6" style={{ marginRight: 6 }} />
              <Text style={styles.presetBtnText}>CSO Authority (Dr. Kulkarni)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleLogin('patrol.alpha@uom.edu', undefined, 'security_team')}
            >
              <FontAwesome5 name="shield-alt" size={13} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.presetBtnText}>Fort Alpha Patrol Squad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleLogin('admin@saferoute.org', undefined, 'super_admin')}
            >
              <FontAwesome5 name="user-cog" size={13} color="#8B5CF6" style={{ marginRight: 6 }} />
              <Text style={styles.presetBtnText}>System Super Administrator</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerNote}>
          SafeRoute Unified Women Safety & Emergency Protection Architecture • 2026
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authWrapper: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#3B82F640',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
    marginTop: 6,
  },
  roleGrid: {
    gap: 8,
    marginBottom: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
  },
  roleCardText: {
    fontSize: 13,
    color: '#94A3B8',
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    height: 46,
    marginTop: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  quickPresetContainer: {
    gap: 8,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
  },
  presetBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },
  footerNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 24,
    textAlign: 'center',
  },
});
