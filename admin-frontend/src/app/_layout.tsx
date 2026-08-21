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
        <Stack.Screen name="authority-dashboard" />
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
