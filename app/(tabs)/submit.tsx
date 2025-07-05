import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { createLeaveRequest } from '@/lib/firestore';
import { Send, Clock, Calendar, User } from 'lucide-react-native';

const requestTypes = [
  { label: 'Leave', value: 'Leave' },
  { label: 'Permission', value: 'Permission' },
];

const leaveTypes = [
  { label: 'Sick Leave', value: 'Sick' },
  { label: 'Casual Leave', value: 'Casual' },
  { label: 'Emergency Leave', value: 'Emergency' },
  { label: 'Annual Leave', value: 'Annual' },
  { label: 'Maternity Leave', value: 'Maternity' },
  { label: 'Paternity Leave', value: 'Paternity' },
];

const leaveDurationOptions = [
  { label: 'Single Day', value: 'single' },
  { label: 'Multiple Days', value: 'multiple' },
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
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [formData, setFormData] = useState({
    empId: '',
    department: '',
    requestType: 'Leave',
    leaveType: '',
    permissionType: '',
    leaveDuration: 'single',
    fromDate: null as Date | null,
    toDate: null as Date | null,
    fromTime: '',
    toTime: '',
    reason: '',
  });

  useEffect(() => {
    loadUserData();
    // Animate in the form
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
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

  const calculateMaxToTime = (fromTime: string): string => {
    if (!fromTime) return '';
    
    const [hour, minute] = fromTime.split(':').map(Number);
    const fromMinutes = hour * 60 + minute;
    const maxMinutes = fromMinutes + 60; // 1 hour later
    
    const maxHour = Math.floor(maxMinutes / 60);
    const maxMinute = maxMinutes % 60;
    
    return `${maxHour.toString().padStart(2, '0')}:${maxMinute.toString().padStart(2, '0')}`;
  };

  const validateForm = () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return false;
    }
    if (user.role !== 'Staff') {
      Alert.alert('Error', 'Only staff members can submit requests');
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
    if (!formData.requestType) {
      Alert.alert('Error', 'Please select request type');
      return false;
    }
    if (formData.requestType === 'Leave' && !formData.leaveType) {
      Alert.alert('Error', 'Please select leave type');
      return false;
    }
    if (formData.requestType === 'Permission' && !formData.permissionType.trim()) {
      Alert.alert('Error', 'Please enter permission type');
      return false;
    }
    if (!formData.fromDate) {
      Alert.alert('Error', 'Please select date');
      return false;
    }
    
    if (formData.requestType === 'Leave') {
      if (formData.leaveDuration === 'multiple' && !formData.toDate) {
        Alert.alert('Error', 'Please select to date');
        return false;
      }
      if (formData.leaveDuration === 'multiple' && formData.fromDate > formData.toDate!) {
        Alert.alert('Error', 'From date cannot be after to date');
        return false;
      }
    }
    
    if (formData.requestType === 'Permission') {
      if (!formData.fromTime) {
        Alert.alert('Error', 'Please select from time');
        return false;
      }
      if (!formData.toTime) {
        Alert.alert('Error', 'Please select to time');
        return false;
      }
      
      // Validate time range (max 1 hour)
      const [fromHour, fromMinute] = formData.fromTime.split(':').map(Number);
      const [toHour, toMinute] = formData.toTime.split(':').map(Number);
      const fromMinutes = fromHour * 60 + fromMinute;
      const toMinutes = toHour * 60 + toMinute;
      const diffMinutes = toMinutes - fromMinutes;
      
      if (diffMinutes <= 0) {
        Alert.alert('Error', 'To time must be after from time');
        return false;
      }
      if (diffMinutes > 60) {
        Alert.alert('Error', 'Permission duration cannot exceed 1 hour');
        return false;
      }
    }
    
    if (!formData.reason.trim()) {
      Alert.alert('Error', 'Please enter reason');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);
    try {
      // Create request data
      const requestData: any = {
        userId: user.id,
        empId: formData.empId,
        department: formData.department,
        requestType: formData.requestType,
        leaveType: formData.requestType === 'Leave' ? formData.leaveType : formData.permissionType,
        fromDate: formData.fromDate!,
        reason: formData.reason,
      };

      // Add conditional fields based on request type
      if (formData.requestType === 'Leave') {
        if (formData.leaveDuration === 'multiple') {
          requestData.toDate = formData.toDate;
        } else {
          requestData.toDate = formData.fromDate; // Single day
        }
      } else if (formData.requestType === 'Permission') {
        requestData.toDate = formData.fromDate; // Same date for permission
        requestData.fromTime = formData.fromTime;
        requestData.toTime = formData.toTime;
      }

      await createLeaveRequest(requestData);

      Alert.alert('Success', `${formData.requestType} request submitted successfully`, [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request');
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
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <User size={24} color="#3B82F6" />
              </View>
              <Text style={styles.title}>Submit Request</Text>
              <Text style={styles.subtitle}>
                Fill in the details for your {formData.requestType.toLowerCase()} request
              </Text>
            </View>

            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
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
                  label="Request Type"
                  options={requestTypes}
                  value={formData.requestType}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    requestType: value,
                    // Reset fields when changing request type
                    leaveType: '',
                    permissionType: '',
                    leaveDuration: 'single',
                    toDate: null,
                    fromTime: '',
                    toTime: '',
                  }))}
                  containerStyle={styles.input}
                />

                {formData.requestType === 'Leave' ? (
                  <Picker
                    label="Leave Type"
                    options={leaveTypes}
                    value={formData.leaveType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}
                    placeholder="Select leave type"
                    containerStyle={styles.input}
                  />
                ) : (
                  <Input
                    label="Permission Type"
                    value={formData.permissionType}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, permissionType: text }))}
                    placeholder="e.g., Doctor appointment, Personal work"
                    containerStyle={styles.input}
                  />
                )}

                {formData.requestType === 'Leave' && (
                  <Picker
                    label="Duration"
                    options={leaveDurationOptions}
                    value={formData.leaveDuration}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      leaveDuration: value,
                      toDate: value === 'single' ? null : prev.toDate,
                    }))}
                    containerStyle={styles.input}
                  />
                )}

                <DatePicker
                  label={formData.requestType === 'Permission' ? 'Date' : 'From Date'}
                  value={formData.fromDate}
                  onValueChange={(date) => setFormData(prev => ({ ...prev, fromDate: date }))}
                  containerStyle={styles.input}
                />

                {formData.requestType === 'Leave' && formData.leaveDuration === 'multiple' && (
                  <DatePicker
                    label="To Date"
                    value={formData.toDate}
                    onValueChange={(date) => setFormData(prev => ({ ...prev, toDate: date }))}
                    containerStyle={styles.input}
                  />
                )}

                {formData.requestType === 'Permission' && (
                  <>
                    <TimePicker
                      label="From Time"
                      value={formData.fromTime}
                      onValueChange={(time) => setFormData(prev => ({ 
                        ...prev, 
                        fromTime: time,
                        toTime: '', // Reset to time when from time changes
                      }))}
                      containerStyle={styles.input}
                    />

                    <TimePicker
                      label="To Time"
                      value={formData.toTime}
                      onValueChange={(time) => setFormData(prev => ({ ...prev, toTime: time }))}
                      minTime={formData.fromTime}
                      maxTime={calculateMaxToTime(formData.fromTime)}
                      containerStyle={styles.input}
                    />
                  </>
                )}

                <Input
                  label="Reason"
                  value={formData.reason}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, reason: text }))}
                  placeholder="Enter reason for request"
                  multiline
                  numberOfLines={4}
                  containerStyle={styles.input}
                />

                <Button
                  title="Submit Request"
                  onPress={handleSubmit}
                  loading={loading}
                  icon={<Send size={20} color="white" />}
                  style={styles.submitButton}
                />
              </CardContent>
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  content: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  input: {
    marginBottom: 0,
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});