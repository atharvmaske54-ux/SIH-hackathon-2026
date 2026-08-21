import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share, Alert } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';

export default function ShareLocationScreen() {
  const router = useRouter();
  const { liveSharingEndTime, liveSharingLink, startLiveSharing, stopLiveSharing } = useAppContext();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (liveSharingEndTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, liveSharingEndTime - Date.now());
        setTimeLeft(remaining);
      }, 1000);
    } else {
      setTimeLeft(0);
    }
    return () => clearInterval(interval);
  }, [liveSharingEndTime]);

  const handleStart = async (minutes: number) => {
    const link = startLiveSharing(minutes);
    try {
      await Share.share({
        message: `Track my live location for the next ${minutes < 60 ? minutes + ' minutes' : (minutes/60) + ' hours'}: ${link}`,
      });
      router.push('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleShareLinkAgain = async () => {
    if (liveSharingLink) {
      try {
        await Share.share({
          message: `Track my live location: ${liveSharingLink}`,
        });
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Live Location Sharing</Text>
      <Text style={styles.subtitle}>
        Generate a secure tracking link that updates your location in real time. The link automatically expires when the timer runs out.
      </Text>

      {liveSharingEndTime && liveSharingLink ? (
        <View style={styles.activeContainer}>
          <FontAwesome5 name="broadcast-tower" size={48} color={Colors.primary} style={{ marginBottom: 16 }} />
          <Text style={styles.activeLabel}>Live Sharing is Active</Text>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{liveSharingLink}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleShareLinkAgain}>
            <FontAwesome5 name="share-alt" size={18} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Share Link Again</Text>
          </Pressable>

          <Pressable style={[styles.primaryButton, styles.stopButton]} onPress={stopLiveSharing}>
            <FontAwesome5 name="stop-circle" size={18} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Stop Sharing</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          <Text style={styles.label}>Select Duration</Text>
          
          <Pressable style={styles.optionButton} onPress={() => handleStart(15)}>
            <FontAwesome5 name="clock" size={24} color={Colors.primary} style={styles.icon} />
            <Text style={styles.optionText}>15 Minutes</Text>
            <FontAwesome5 name="share-alt" size={16} color={Colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.optionButton} onPress={() => handleStart(60)}>
            <FontAwesome5 name="hourglass-half" size={24} color={Colors.primary} style={styles.icon} />
            <Text style={styles.optionText}>1 Hour</Text>
            <FontAwesome5 name="share-alt" size={16} color={Colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.optionButton} onPress={() => handleStart(480)}>
            <FontAwesome5 name="infinity" size={24} color={Colors.primary} style={styles.icon} />
            <Text style={styles.optionText}>8 Hours</Text>
            <FontAwesome5 name="share-alt" size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  activeContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 10,
  },
  activeLabel: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 24,
    fontVariant: ['tabular-nums'],
  },
  linkBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stopButton: {
    backgroundColor: Colors.danger,
    marginBottom: 0,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionsContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    width: 36,
  },
  optionText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  }
});
