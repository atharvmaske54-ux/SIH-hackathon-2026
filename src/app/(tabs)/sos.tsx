import { View, Text, StyleSheet, Pressable, Animated, Alert, Platform, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useAppContext } from '../../context/AppContext';
import { useRouter } from 'expo-router';

export default function SOSScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { contacts } = useAppContext();
  
  // SOS Animation State
  const sosProgress = useRef(new Animated.Value(0)).current;
  const sosScale = useRef(new Animated.Value(1)).current;
  const [isHolding, setIsHolding] = useState(false);
  const sosTimeout = useRef<any>(null);

  const triggerSOS = async () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Add trusted contacts first.');
      return;
    }
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const message = `EMERGENCY SOS: I need help! My location is: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      const phoneNumbers = contacts.map(c => c.phone);
      
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
      } else {
        Alert.alert('SOS Triggered', 'Location obtained, but SMS is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send SOS');
    }
  };

  const handleSosPressIn = () => {
    setIsHolding(true);
    Animated.parallel([
      Animated.timing(sosProgress, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }),
      Animated.spring(sosScale, {
        toValue: 0.9,
        useNativeDriver: true,
      })
    ]).start();

    sosTimeout.current = setTimeout(() => {
      triggerSOS();
      handleSosPressOut(); // Reset after trigger
    }, 3000);
  };

  const handleSosPressOut = () => {
    setIsHolding(false);
    if (sosTimeout.current) clearTimeout(sosTimeout.current);
    
    Animated.parallel([
      Animated.timing(sosProgress, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.spring(sosScale, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();
  };

  const fillWidth = sosProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const handleCall = (phone: string) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Phone dialer is not available on this device');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Emergency SOS</Text>
          <Text style={styles.subtitle}>Alert your trusted contacts with your live location.</Text>
        </View>

        {/* Hold SOS Button */}
        <View style={styles.sosContainer}>
          <Text style={styles.sosInstruction}>
            {isHolding ? 'HOLDING...' : 'HOLD FOR 3 SEC TO SOS'}
          </Text>
          
          <Pressable 
            onPressIn={handleSosPressIn} 
            onPressOut={handleSosPressOut}
            style={styles.sosPressableArea}
          >
            <Animated.View style={[styles.sosOuterCircle, { transform: [{ scale: sosScale }] }]}>
              <View style={styles.sosInnerCircle}>
                <Animated.View style={[styles.sosFill, { height: fillWidth, bottom: 0 }]} />
                <FontAwesome5 name="shield-alt" size={48} color={Colors.white} style={{ zIndex: 10 }} />
                <Text style={styles.sosText}>SOS</Text>
              </View>
            </Animated.View>
          </Pressable>
        </View>

        {/* Contact List Section */}
        <View style={styles.contactsSection}>
          <Text style={styles.contactsHeader}>Trusted Contacts</Text>
          
          {contacts.length === 0 ? (
            <Text style={styles.emptyText}>No contacts added yet.</Text>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{contact.name.charAt(0)}</Text>
                </View>
                
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
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
        </View>

      </ScrollView>
    </View>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.danger,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sosInstruction: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  sosPressableArea: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosOuterCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInnerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  sosFill: {
    position: 'absolute',
    width: '100%',
    backgroundColor: Colors.danger,
  },
  sosText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
    zIndex: 10,
    letterSpacing: 2,
  },
  contactsSection: {
    width: '100%',
  },
  contactsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 10,
  },
  contactCard: {
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
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  }
});
