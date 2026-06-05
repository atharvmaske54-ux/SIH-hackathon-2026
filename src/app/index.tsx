import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <FontAwesome5 name="shield-alt" size={80} color={Colors.safe} />
        <Text style={styles.title}>SafeRoute</Text>
        <Text style={styles.tagline}>Navigate Smart. Stay Safe.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 20,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 10,
    fontWeight: '500',
  },
});
