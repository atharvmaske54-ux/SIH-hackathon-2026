import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAppContext } from '../context/AppContext';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';

import AIChatbotFloating from '../components/AIChatbotFloating';

function InnerLayout() {
  const { theme } = useAppContext();
  
  return (
    <>
      {/* @ts-ignore: backgroundColor is a valid prop for expo-status-bar on Android */}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={Colors.background} />
      <Stack key={theme} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contacts" options={{ headerShown: true, title: 'Trusted Contacts', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
        <Stack.Screen name="alerts" options={{ headerShown: true, title: 'Alerts & Notifications', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
        <Stack.Screen name="fake-call" options={{ headerShown: true, title: 'Fake Call Setup', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
        <Stack.Screen name="check-in" options={{ headerShown: true, title: 'Safety Check-In', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
        <Stack.Screen name="share-location" options={{ headerShown: true, title: 'Live Location', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
        <Stack.Screen name="report-incident" options={{ headerShown: true, title: 'Report Safety Incident', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      </Stack>
      <AIChatbotFloating />
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    FontAwesome5_Solid: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf'),
    FontAwesome5_Regular: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <AppProvider>
      <InnerLayout />
    </AppProvider>
  );
}
