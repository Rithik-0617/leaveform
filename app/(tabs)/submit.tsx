import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { DatePicker } from '@/components/ui/DatePicker';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { createLeaveRequest, uploadFile } from '@/lib/firestore';
import { Upload, Send } from 'lucide-react-native';

const leaveTypes = [
  { label: 'Sick Leave', value: 'Sick' },
  { label: 'Casual Leave', value: 'Casual' },
  { label: 'Emergency Leave', value: 'Emergency' },
  { label: 'Annual Leave', value: 'Annual' },
  { label: 'Maternity Leave', value: 'Maternity' },
  { label: 'Paternity Leave', value: 'Paternity' },
];

const departmentOptions = [
  { label: 'Human Resources', value: 'HR' },
  { label: 'Information Technology', value: 'IT' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Sales', value: 'Sales' },
];

export default function SubmitLeaveScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    empId: '',
    department: '',
    leaveType: '',
    fromDate: null as Date | null,
    toDate: null as Date | null,
    reason: '',
    file: null as any,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData(prev => ({ ...prev, department: currentUser.department }));
      } else {
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/auth');
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, file: result.assets[0] }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const validateForm = () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return false;
    }
    if (user.role !== 'Staff') {
      Alert.alert('Error', 'Only staff members can submit leave requests');
      return false;
    }
    if (!formData.empId.trim()) {
      Alert.alert('Error', 'Please enter your Employee ID');
      return false;
    }
    if (!formData.department) {
      Alert.alert('Error', 'Please select your department');
      return false;
    }
    if (!formData.leaveType) {
      Alert.alert('Error', 'Please select leave type');
      return false;
    }
    if (!formData.fromDate) {
      Alert.alert('Error', 'Please select from date');
      return false;
    }
    if (!formData.toDate) {
      Alert.alert('Error', 'Please select to date');
      return false;
    }
    if (formData.fromDate > formData.toDate) {
      Alert.alert('Error', 'From date cannot be after to date');
      return false;
    }
    if (!formData.reason.trim()) {
      Alert.alert('Error', 'Please enter reason for leave');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);
    try {
      let fileUrl: string | null = null;

      // Upload file if selected
      if (formData.file) {
        fileUrl = await uploadFile(formData.file, user.id);
      }

      // Create leave request - only include fileUrl if it exists
      const requestData: any = {
        userId: user.id,
        empId: formData.empId,
        department: formData.department,
        leaveType: formData.leaveType,
        fromDate: formData.fromDate!,
        toDate: formData.toDate!,
        reason: formData.reason,
      };

      // Only add fileUrl if it's not null
      if (fileUrl) {
        requestData.fileUrl = fileUrl;
      }

      await createLeaveRequest(requestData);

      Alert.alert('Success', 'Leave request submitted successfully', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Submit Leave Request
            </Text>
            <Text style={styles.subtitle}>
              Fill in the details for your leave request
            </Text>
          </View>

          <Card>
            <CardHeader>
              <Text style={styles.cardTitle}>Request Details</Text>
            </CardHeader>
            <CardContent style={styles.form}>
              <Input
                label="Employee ID"
                value={formData.empId}
                onChangeText={(text) => setFormData(prev => ({ ...prev, empId: text }))}
                placeholder="Enter your employee ID"
                containerStyle={styles.input}
              />

              <Picker
                label="Department"
                options={departmentOptions}
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                containerStyle={styles.input}
              />

              <Picker
                label="Leave Type"
                options={leaveTypes}
                value={formData.leaveType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}
                placeholder="Select leave type"
                containerStyle={styles.input}
              />

              <DatePicker
                label="From Date"
                value={formData.fromDate}
                onValueChange={(date) => setFormData(prev => ({ ...prev, fromDate: date }))}
                containerStyle={styles.input}
              />

              <DatePicker
                label="To Date"
                value={formData.toDate}
                onValueChange={(date) => setFormData(prev => ({ ...prev, toDate: date }))}
                containerStyle={styles.input}
              />

              <Input
                label="Reason"
                value={formData.reason}
                onChangeText={(text) => setFormData(prev => ({ ...prev, reason: text }))}
                placeholder="Enter reason for leave"
                multiline
                numberOfLines={3}
                containerStyle={styles.input}
              />

              <View style={styles.fileSection}>
                <Text style={styles.fileLabel}>
                  Supporting Document (Optional)
                </Text>
                <Button
                  title={formData.file ? formData.file.name : 'Upload File'}
                  onPress={handleFilePick}
                  variant="secondary"
                  icon={<Upload size={20} color="white" />}
                />
                {formData.file && (
                  <Text style={styles.fileSelectedText}>
                    File selected: {formData.file.name}
                  </Text>
                )}
              </View>

              <Button
                title="Submit Request"
                onPress={handleSubmit}
                loading={loading}
                icon={<Send size={20} color="white" />}
                style={styles.submitButton}
              />
            </CardContent>
          </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 0,
  },
  fileSection: {
    gap: 8,
  },
  fileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  fileSelectedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  submitButton: {
    marginTop: 8,
  },
});