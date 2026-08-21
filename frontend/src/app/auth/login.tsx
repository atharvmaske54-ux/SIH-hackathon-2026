import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

export default function LoginScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { setUser } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    if (!otpSent) {
      // Simulate sending OTP
      setOtpSent(true);
      Alert.alert('OTP Sent', 'An OTP has been sent to your registered email address.');
      return;
    }

    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    // OTP verified
    setUser({ name: 'User', email, phone: '+1234567890', role: 'student' });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="shield-alt" size={42} color={Colors.white} />
          </View>
          <Text style={styles.appName}>GuardianX</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <FontAwesome5 name="envelope" size={18} color={Colors.textSecondary} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!otpSent}
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={18} color={Colors.textSecondary} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!otpSent}
            />
          </View>

          {otpSent && (
            <View style={styles.inputContainer}>
              <FontAwesome5 name="key" size={18} color={Colors.textSecondary} style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter OTP (sent to email)" 
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
            </View>
          )}

          {!otpSent && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>{otpSent ? 'Verify OTP & Sign In' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome5 name="google" size={20} color="#DB4437" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome5 name="envelope" size={20} color={Colors.primary} />
              <Text style={styles.socialButtonText}>Email</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 16,
    width: 20,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 56,
    backgroundColor: Colors.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  registerLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
