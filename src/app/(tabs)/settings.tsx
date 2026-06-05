import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../context/AppContext';

export default function SettingsScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { user } = useAppContext();
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [autoRecord, setAutoRecord] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'J'}</Text>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions</Text>
        
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SOS Settings</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <FontAwesome5 name="microphone-alt" size={20} color={Colors.primary} style={styles.settingIcon} />
            <Text style={styles.settingText}>Auto-Record Voice on SOS</Text>
          </View>
          <Switch 
            value={autoRecord} 
            onValueChange={setAutoRecord}
            trackColor={{ false: Colors.border, true: Colors.safe }}
          />
        </View>

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Test SOS Functionality</Text>
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
    padding: 30,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editIcon: {
    marginLeft: 10,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginLeft: 20,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 30,
  },
  settingText: {
    fontSize: 16,
    color: Colors.text,
  },
  actionBtn: {
    padding: 16,
    alignItems: 'center',
  },
  actionBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutBtn: {
    margin: 20,
    marginTop: 40,
    backgroundColor: Colors.dangerLight,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
