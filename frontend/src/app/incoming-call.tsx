import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Vibration, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';

export default function IncomingCallScreen() {
  const { callerName } = useLocalSearchParams();
  const router = useRouter();
  const [isAnswered, setIsAnswered] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const player = useAudioPlayer('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=classic-ringtone-9979.mp3');

  // Animation for pulsing the caller icon
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    
    if (!isAnswered) {
      // Vibrate pattern: 1s vibrate, 1s pause
      const PATTERN = [1000, 1000];
      Vibration.vibrate(PATTERN, true);
      
      if (player) {
        player.loop = true;
        player.play();
      }

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();

      // Auto decline after 60 seconds
      interval = setTimeout(() => {
        handleEndCall();
      }, 60000);
    } else {
      Vibration.cancel();
      if (player) {
        player.pause();
      }
      pulseAnim.stopAnimation();
    }

    return () => {
      Vibration.cancel();
      clearTimeout(interval);
      if (player) {
        player.pause();
      }
    };
  }, [isAnswered, player]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isAnswered) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAnswered]);

  const handleAnswer = async () => {
    setIsAnswered(true);
    if (player) {
      player.pause();
    }
    Vibration.cancel();
  };

  const handleEndCall = async () => {
    if (player) {
      player.pause();
    }
    Vibration.cancel();
    router.back();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: isAnswered ? 1 : pulseAnim }] }]}>
          <FontAwesome5 name="user-alt" size={50} color="#fff" />
        </Animated.View>
        <Text style={styles.callerName}>{callerName || 'Unknown'}</Text>
        <Text style={styles.statusText}>
          {isAnswered ? formatTime(callDuration) : 'Incoming Call...'}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        {!isAnswered ? (
          <View style={styles.actionsContainer}>
            <View style={styles.actionButtonWrapper}>
              <Pressable style={[styles.callButton, styles.declineButton]} onPress={handleEndCall}>
                <FontAwesome5 name="phone-slash" size={28} color="#fff" />
              </Pressable>
              <Text style={styles.actionText}>Decline</Text>
            </View>

            <View style={styles.actionButtonWrapper}>
              <Pressable style={[styles.callButton, styles.answerButton]} onPress={handleAnswer}>
                <FontAwesome5 name="phone" size={28} color="#fff" />
              </Pressable>
              <Text style={styles.actionText}>Accept</Text>
            </View>
          </View>
        ) : (
          <View style={styles.actionsContainerSingle}>
            <View style={styles.actionButtonWrapper}>
              <Pressable style={[styles.callButton, styles.declineButton]} onPress={handleEndCall}>
                <FontAwesome5 name="phone-slash" size={28} color="#fff" />
              </Pressable>
              <Text style={styles.actionText}>End Call</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // standard dark mode call screen bg
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  callerName: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  bottomSection: {
    marginBottom: 60,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionsContainerSingle: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  actionButtonWrapper: {
    alignItems: 'center',
  },
  callButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  declineButton: {
    backgroundColor: '#FF3B30', // iOS Red
  },
  answerButton: {
    backgroundColor: '#34C759', // iOS Green
  },
  actionText: {
    fontSize: 16,
    color: '#FFFFFF',
  }
});
