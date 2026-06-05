import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

export default function GroupScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { contacts } = useAppContext();

  const handleCall = (phone: string) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone dialer is not available.');
      }
    });
  };

  const handleGroupCall = () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Add trusted contacts first to initiate a group call.');
      return;
    }
    Alert.alert('Group Call Initiated', 'Simulating a conference call with all your trusted contacts.');
  };

  const handleGroupSMS = async () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Add trusted contacts first to send a group SMS.');
      return;
    }

    try {
      let locationMsg = '';
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        // PROTOTYPE OVERRIDE: Force location to Mhada Colony, Mankhurd
        location.coords.latitude = 19.0486;
        location.coords.longitude = 72.9393;
        
        locationMsg = ` I am currently here: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      }

      const message = `GROUP UPDATE: I am safe and checking in with my trusted contacts.${locationMsg}`;
      const phoneNumbers = contacts.map(c => c.phone);
      
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
      } else {
        Alert.alert('SMS Triggered', 'SMS is not available on this device, but the action was initiated.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare the group SMS.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Trusted Contacts</Text>
          <TouchableOpacity onPress={() => router.push('/contacts')} style={{ padding: 8, backgroundColor: Colors.primaryLight, borderRadius: 12 }}>
             <FontAwesome5 name="user-plus" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Contacts</Text>
            <Text style={styles.statValue}>{contacts.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, { color: Colors.safe }]}>All Monitored</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Contact Roster</Text>

        {contacts.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={styles.emptyText}>You haven't added any trusted contacts yet.</Text>
            <TouchableOpacity onPress={() => router.push('/contacts')} style={{ marginTop: 15, padding: 12, backgroundColor: Colors.primary, borderRadius: 8 }}>
              <Text style={{ color: Colors.white, fontWeight: 'bold' }}>Add Contact Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.memberCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{contact.name.charAt(0)}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{contact.name}</Text>
                <Text style={styles.memberDetails}>{contact.phone}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCall(contact.phone)}
              >
                <FontAwesome5 name="phone-alt" size={16} color={Colors.white} />
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.callGroupBtn]} onPress={handleGroupCall}>
          <FontAwesome5 name="phone-volume" size={20} color={Colors.white} />
          <Text style={styles.actionBtnText}>Group Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.smsGroupBtn]} onPress={handleGroupSMS}>
          <FontAwesome5 name="comment-alt" size={20} color={Colors.white} />
          <Text style={styles.actionBtnText}>Group SMS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Space for bottom actions
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  memberDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.safe,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.safe,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  callText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  callGroupBtn: {
    backgroundColor: Colors.safe,
  },
  smsGroupBtn: {
    backgroundColor: Colors.primary,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});
