import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Clock } from 'lucide-react-native';

interface TimePickerProps {
  label?: string;
  value: string;
  onValueChange: (time: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: any;
  minTime?: string;
  maxTime?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onValueChange,
  placeholder = 'Select time',
  error,
  containerStyle,
  minTime,
  maxTime,
}) => {
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [ampm, setAmpm] = useState('AM');
  const [focusedInput, setFocusedInput] = useState<'hour' | 'minute' | null>(null);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hourNum = parseInt(h);
      const displayHour = hourNum % 12 || 12;
      const period = hourNum >= 12 ? 'PM' : 'AM';
      
      setHour(displayHour.toString());
      setMinute(m);
      setAmpm(period);
    }
  }, [value]);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const updateTime = (newHour: string, newMinute: string, newAmpm: string) => {
    if (newHour && newMinute) {
      const hourNum = parseInt(newHour);
      const minuteNum = parseInt(newMinute);
      
      if (hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59) {
        let hour24 = hourNum;
        if (newAmpm === 'PM' && hourNum !== 12) {
          hour24 += 12;
        } else if (newAmpm === 'AM' && hourNum === 12) {
          hour24 = 0;
        }
        
        const timeString = `${hour24.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
        
        // Check time constraints
        if (minTime && timeString < minTime) return;
        if (maxTime && timeString > maxTime) return;
        
        onValueChange(timeString);
      }
    }
  };

  const handleHourChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText === '' || (parseInt(numericText) >= 1 && parseInt(numericText) <= 12)) {
      setHour(numericText);
      updateTime(numericText, minute, ampm);
    }
  };

  const handleMinuteChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText === '' || (parseInt(numericText) >= 0 && parseInt(numericText) <= 59)) {
      const formattedMinute = numericText.length === 1 ? numericText : numericText.padStart(2, '0');
      setMinute(formattedMinute);
      updateTime(hour, formattedMinute, ampm);
    }
  };

  const handleAmpmToggle = () => {
    animatePress();
    const newAmpm = ampm === 'AM' ? 'PM' : 'AM';
    setAmpm(newAmpm);
    updateTime(hour, minute, newAmpm);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.timePickerContainer,
        error && styles.timePickerError,
      ]}>
        <View style={styles.clockIconContainer}>
          <Clock size={20} color="#6B7280" />
        </View>
        
        <TextInput
          style={[
            styles.timeInput,
            focusedInput === 'hour' && styles.timeInputFocused,
          ]}
          value={hour}
          onChangeText={handleHourChange}
          onFocus={() => setFocusedInput('hour')}
          onBlur={() => setFocusedInput(null)}
          placeholder="12"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={2}
          textAlign="center"
        />
        
        <Text style={styles.timeSeparator}>:</Text>
        
        <TextInput
          style={[
            styles.timeInput,
            focusedInput === 'minute' && styles.timeInputFocused,
          ]}
          value={minute}
          onChangeText={handleMinuteChange}
          onFocus={() => setFocusedInput('minute')}
          onBlur={() => setFocusedInput(null)}
          placeholder="00"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={2}
          textAlign="center"
        />
        
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={handleAmpmToggle}
            style={[
              styles.ampmButton,
              ampm === 'PM' && styles.ampmButtonActive,
            ]}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.ampmText,
              ampm === 'PM' && styles.ampmTextActive,
            ]}>
              {ampm}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  timePickerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timePickerError: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  clockIconContainer: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  timeInput: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    minWidth: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontWeight: '600',
  },
  timeInputFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  timeSeparator: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '700',
    marginHorizontal: 8,
  },
  ampmButton: {
    marginLeft: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 50,
  },
  ampmButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  ampmText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  ampmTextActive: {
    color: 'white',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    marginLeft: 4,
  },
});
