import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { onAuthStateChange, getCurrentUser } from '@/lib/auth';

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      try {
        if (user) {
          // Check if user profile exists
          const profile = await getCurrentUser();
          if (profile) {
            router.replace('/(tabs)');
          } else {
            router.replace('/auth');
          }
        } else {
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/auth');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});