import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';

export default function CheckInScreen() {
  const router = useRouter();
  const { checkInEndTime, startCheckIn, cancelCheckIn } = useAppContext();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (checkInEndTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, checkInEndTime - Date.now());
        setTimeLeft(remaining);
      }, 1000);
    } else {
      setTimeLeft(0);
    }
    return () => clearInterval(interval);
  }, [checkInEndTime]);

  const handleStart = (minutes: number) => {
    startCheckIn(minutes);
    router.push('/(tabs)');
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Safety Check-In</Text>
      <Text style={styles.subtitle}>
        Set a timer. If you do not cancel it before the time runs out, an SOS alert with your location will be automatically sent to your trusted contacts.
      </Text>

      {checkInEndTime ? (
        <View style={styles.activeTimerContainer}>
          <FontAwesome5 name="clock" size={48} color={Colors.safe} style={{ marginBottom: 16 }} />
          <Text style={styles.timerLabel}>Time Remaining</Text>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          
          <Pressable style={styles.cancelButton} onPress={cancelCheckIn}>
            <FontAwesome5 name="times-circle" size={20} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.cancelButtonText}>Cancel Timer</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          <Text style={styles.label}>Select Duration</Text>
          
          <Pressable style={styles.optionButton} onPress={() => handleStart(5)}>
            <FontAwesome5 name="stopwatch" size={24} color={Colors.primary} style={styles.icon} />
            <Text style={styles.optionText}>5 Minutes</Text>
            <FontAwesome5 name="chevron-right" size={16} color={Colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.optionButton} onPress={() => handleStart(10)}>
            <FontAwesome5 name="stopwatch" size={24} color={Colors.primary} style={styles.icon} />
            <Text style={styles.optionText}>10 Minutes</Text>
            <FontAwesome5 name="chevron-right" size={16} color={Colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.optionButton} onPress={() => handleStart(15)}>
            <FontAwesome5 name="stopwatch" size={24} color={Colors.primary} style={styles.icon} />
            <Text style={styles.optionText}>15 Minutes</Text>
            <FontAwesome5 name="chevron-right" size={16} color={Colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.optionButton} onPress={() => handleStart(30)}>
            <FontAwesome5 name="stopwatch" size={24} color={Colors.primary} style={styles.icon} />
            <Text style={styles.optionText}>30 Minutes</Text>
            <FontAwesome5 name="chevron-right" size={16} color={Colors.textSecondary} />
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
  activeTimerContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 20,
  },
  timerLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 32,
    fontVariant: ['tabular-nums'],
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: Colors.danger,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsContainer: {
    marginTop: 16,
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
