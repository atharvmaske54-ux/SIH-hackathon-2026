import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
          backgroundColor: Colors.background,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          color: Colors.primary,
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
              <FontAwesome5 name="shield-alt" size={14} color={Colors.white} />
            </View>
          </View>
        )
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <FontAwesome5 name="map-marked-alt" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color }) => <FontAwesome5 name="exclamation-circle" size={28} color={Colors.danger} />,
          tabBarLabelStyle: { color: Colors.danger, fontWeight: 'bold' }
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: 'Group',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <FontAwesome5 name="cog" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
