import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { signIn, signUp } from '@/lib/auth';
import { Mail, Lock, User, Building } from 'lucide-react-native';

const departmentOptions = [
  { label: 'Human Resources', value: 'HR' },
  { label: 'Information Technology', value: 'IT' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Sales', value: 'Sales' },
];

const roleOptions = [
  { label: 'Staff', value: 'Staff' },
  { label: 'Director', value: 'Director' },
];

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Staff',
    department: '',
    employeeId: '',
  });

  const handleAuth = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && (!formData.name || !formData.employeeId || (formData.role === 'Staff' && !formData.department))) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.role as 'Staff' | 'Director',
          formData.department,
          formData.employeeId
        );
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>
                Leave Manager
              </Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Sign in to your account' : 'Create your account'}
              </Text>
            </View>

            <Card>
              <CardHeader>
                <Text style={styles.cardTitle}>
                  {isLogin ? 'Login' : 'Sign Up'}
                </Text>
              </CardHeader>
              <CardContent style={styles.form}>
                <Input
                  label="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={<Mail size={20} color="#6B7280" />}
                  containerStyle={styles.input}
                />

                <Input
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter your password"
                  secureTextEntry
                  icon={<Lock size={20} color="#6B7280" />}
                  containerStyle={styles.input}
                />

                {!isLogin && (
                  <>
                    <Input
                      label="Full Name"
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      placeholder="Enter your full name"
                      icon={<User size={20} color="#6B7280" />}
                      containerStyle={styles.input}
                    />

                    <Input
                      label="Employee ID"
                      value={formData.employeeId}
                      onChangeText={(text) => setFormData({ ...formData, employeeId: text })}
                      placeholder="Enter your employee ID"
                      icon={<User size={20} color="#6B7280" />}
                      containerStyle={styles.input}
                    />

                    <Picker
                      label="Role"
                      options={roleOptions}
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value, department: value === 'Staff' ? formData.department : '' })}
                      containerStyle={styles.input}
                    />

                    {formData.role === 'Staff' && (
                      <Picker
                        label="Department"
                        options={departmentOptions}
                        value={formData.department}
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                        placeholder="Select your department"
                        containerStyle={styles.input}
                      />
                    )}
                  </>
                )}

                <Button
                  title={isLogin ? 'Sign In' : 'Sign Up'}
                  onPress={handleAuth}
                  loading={loading}
                  style={styles.submitButton}
                />

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  </Text>
                  <Text
                    style={styles.switchLink}
                    onPress={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 0,
  },
  submitButton: {
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: {
    color: '#6B7280',
    fontSize: 16,
  },
  switchLink: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 16,
  },
});