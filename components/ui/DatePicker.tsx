import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onValueChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: any;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onValueChange,
  placeholder = 'Select date',
  error,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openModal = () => {
    setSelectedMonth(value ? value.getMonth() : new Date().getMonth());
    setSelectedYear(value ? value.getFullYear() : new Date().getFullYear());
    setModalVisible(true);
  };

  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDaySelect = (day: number) => {
    if (selectedMonth !== null) {
      const date = new Date(selectedYear, selectedMonth, day);
      onValueChange(date);
      setModalVisible(false);
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth((selectedMonth ?? 0) - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth((selectedMonth ?? 0) + 1);
    }
  };

  // Render day grid for the selected month
  const renderDayGrid = () => {
    if (selectedMonth === null) return null;
    const days = daysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfWeek(selectedMonth, selectedYear);
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();

    let grid: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= days; d++) grid.push(d);

    // Fill the last row to 7 days
    while (grid.length % 7 !== 0) grid.push(null);

    return (
      <View style={styles.dayGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
          <Text key={i} style={styles.dayHeader}>{w}</Text>
        ))}
        {grid.map((d, i) => {
          const isToday = isCurrentMonth && d === today.getDate();
          const isSelected = value &&
            value.getDate() === d &&
            value.getMonth() === selectedMonth &&
            value.getFullYear() === selectedYear;
          return (
            <TouchableOpacity
              key={i}
              disabled={!d}
              onPress={() => d && handleDaySelect(d)}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDayCell,
                isToday && styles.todayCell,
                !d && styles.emptyDayCell,
              ]}
            >
              <Text style={[
                styles.dayCellText,
                isSelected && styles.selectedDayCellText,
                isToday && styles.todayCellText,
                !d && styles.emptyDayCellText,
              ]}>
                {d ? d : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={openModal}
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
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                <Text style={styles.monthNavText}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {MONTHS[selectedMonth ?? 0]} {selectedYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                <Text style={styles.monthNavText}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              {renderDayGrid()}
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
    maxWidth: 400,
    maxHeight: '80%',
    alignItems: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
  },
  monthNavBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthNavText: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '700',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 308,
    alignSelf: 'center',
    marginBottom: 8,
  },
  dayHeader: {
    width: 44,
    textAlign: 'center',
    fontWeight: '700',
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  dayCell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    backgroundColor: 'transparent',
  },
  selectedDayCell: {
    backgroundColor: '#3B82F6',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  emptyDayCell: {
    backgroundColor: 'transparent',
  },
  dayCellText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  selectedDayCellText: {
    color: 'white',
    fontWeight: '700',
  },
  todayCellText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  emptyDayCellText: {
    color: 'transparent',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: '100%',
  },
  cancelText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});