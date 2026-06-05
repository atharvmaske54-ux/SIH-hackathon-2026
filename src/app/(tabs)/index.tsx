import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

// Reusable Animated Pressable Component
const AnimatedPressable = ({ onPress, children, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={{ flex: 1 }}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { user, contacts, theme, toggleTheme } = useAppContext();
  
  // SOS Animation State
  const sosScale = useRef(new Animated.Value(1)).current;

  const triggerSOS = async () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Add trusted contacts first.');
      return;
    }
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      
      // PROTOTYPE OVERRIDE: Force location to Mhada Colony, Mankhurd
      location.coords.latitude = 19.0486;
      location.coords.longitude = 72.9393;

      const message = `EMERGENCY SOS: I need help! My location is: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      const phoneNumbers = contacts.map((c: any) => c.phone);
      
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

  // Instant SOS trigger wrapper to provide haptic feedback or instant response
  const handleInstantSOS = () => {
    // Optionally trigger haptic feedback here if expo-haptics was installed
    Animated.sequence([
      Animated.timing(sosScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(sosScale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    
    triggerSOS();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.logoRow}>
          <FontAwesome5 name="shield-alt" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>GuardianX</Text>
        </View>
        <Pressable onPress={toggleTheme} style={styles.themeToggle}>
          <FontAwesome5 name={theme === 'dark' ? 'moon' : 'lightbulb'} solid={theme === 'dark'} size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Current Location</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Safe Zone</Text>
          </View>
        </View>
        <Text style={styles.locationText} numberOfLines={2}>
          {user?.address || 'Detecting Location...'}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        <AnimatedPressable onPress={() => router.push('/contacts')} style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
            <FontAwesome5 name="address-book" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.actionText}>Contacts</Text>
        </AnimatedPressable>

        <View style={{ width: 16 }} />

        <AnimatedPressable onPress={() => router.push('/alerts')} style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: Colors.safeLight }]}>
            <FontAwesome5 name="bell" size={24} color={Colors.safe} />
          </View>
          <Text style={styles.actionText}>Alerts</Text>
        </AnimatedPressable>
      </View>

      {/* Instant SOS Button */}
      <View style={styles.sosContainer}>
        <Text style={styles.sosInstruction}>
          TAP INSTANTLY TO SEND SOS
        </Text>
        
        <Pressable 
          onPress={handleInstantSOS}
          style={styles.sosPressableArea}
        >
          <Animated.View style={[styles.sosOuterCircle, { transform: [{ scale: sosScale }] }]}>
            <View style={[styles.sosInnerCircle, { backgroundColor: Colors.danger }]}>
              <FontAwesome5 name="shield-alt" size={48} color={Colors.white} style={{ zIndex: 10 }} />
              <Text style={styles.sosText}>SOS</Text>
            </View>
          </Animated.View>
        </Pressable>
      </View>

      {/* Group Action */}
      <AnimatedPressable onPress={() => router.push('/(tabs)/group')} style={styles.groupButton}>
        <FontAwesome5 name="users" size={20} color={Colors.primary} style={styles.groupIcon} />
        <Text style={styles.groupText}>Create / Manage Group</Text>
        <FontAwesome5 name="chevron-right" size={16} color={Colors.textSecondary} />
      </AnimatedPressable>
    </ScrollView>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 48, // Add padding for status bar if needed, or just safe area
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  themeToggle: {
    padding: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusCard: {
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.safeLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.safe,
    marginRight: 6,
  },
  statusText: {
    color: Colors.safe,
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: 10,
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
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosOuterCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInnerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
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
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
    zIndex: 10,
    letterSpacing: 2,
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  groupIcon: {
    marginRight: 16,
  },
  groupText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  }
});
