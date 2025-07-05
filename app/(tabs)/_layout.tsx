import { Tabs } from 'expo-router';
import { Home, User, Send } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { View, Text, ActivityIndicator } from 'react-native';

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  // Create screens array based on user role
  const getTabScreens = () => {
    const screens = [
      <Tabs.Screen
        key="index"
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />,
      <Tabs.Screen
        key="profile"
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />,
    ];

    // Only show submit tab for Staff users
    if (user?.role === 'Staff') {
      screens.push(
        <Tabs.Screen
          key="submit"
          name="submit"
          options={{
            title: 'Submit',
            tabBarIcon: ({ size, color }) => (
              <Send size={size} color={color} />
            ),
          }}
        />
      );
    } else {
      // For Directors, hide the submit tab completely
      screens.push(
        <Tabs.Screen
          key="submit"
          name="submit"
          options={{
            href: null, // This hides the tab from the tab bar
          }}
        />
      );
    }

    return screens;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      {getTabScreens()}
    </Tabs>
  );
}