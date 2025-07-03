import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onValueChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onValueChange,
  placeholder = 'Select date',
  error,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateSelect = () => {
    if (Platform.OS === 'web') {
      // For web, we'll use a simple date selection
      const today = new Date();
      onValueChange(today);
    } else {
      setModalVisible(true);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    // Generate next 60 days
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={handleDateSelect}
        style={[
          styles.datePicker,
          error && styles.datePickerError,
        ]}
      >
        <Text style={[
          styles.dateText,
          !value && styles.placeholderText,
        ]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Calendar size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select Date
            </Text>
            <ScrollView style={styles.dateOptions}>
              {generateDateOptions().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    onValueChange(date);
                    setModalVisible(false);
                  }}
                  style={styles.dateOption}
                >
                  <Text style={styles.dateOptionText}>
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  datePicker: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  datePickerError: {
    borderColor: '#EF4444',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 16,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#111827',
  },
  dateOptions: {
    maxHeight: 300,
  },
  dateOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  dateOptionText: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  cancelText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});