import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { setUser } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!name || !email || !phone || !address || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setUser({ name, email, phone, address, role: 'student' });
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Empowering your safety journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <FontAwesome5 name="user" size={18} color={Colors.textSecondary} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={Colors.textSecondary} value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="envelope" size={18} color={Colors.textSecondary} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={Colors.textSecondary} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="phone" size={18} color={Colors.textSecondary} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={Colors.textSecondary} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="map-marker-alt" size={18} color={Colors.textSecondary} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Home Address" placeholderTextColor={Colors.textSecondary} value={address} onChangeText={setAddress} />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={18} color={Colors.textSecondary} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.textSecondary} secureTextEntry value={password} onChangeText={setPassword} />
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Sign Up</Text>
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

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    backgroundColor: Colors.background, // Premium light background
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    marginTop: 40,
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
  registerButton: {
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
  registerButtonText: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
