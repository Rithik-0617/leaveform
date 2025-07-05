import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Card, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { StatusBadge } from './StatusBadge';
import { Check, X, FileText, Calendar, User } from 'lucide-react-native';
import { updateLeaveRequestStatus } from '@/lib/firestore';
import { LeaveRequest } from '@/lib/firestore';

interface LeaveRequestCardProps {
  request: LeaveRequest;
  isDirector?: boolean;
  onUpdate?: () => void;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
  request,
  isDirector = false,
  onUpdate,
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await updateLeaveRequestStatus(request.id, 'Approved');
      Alert.alert('Success', 'Leave request approved successfully');
      onUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remark.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await updateLeaveRequestStatus(request.id, 'Rejected', remark);
      Alert.alert('Success', 'Leave request rejected');
      setShowRejectModal(false);
      setRemark('');
      onUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDuration = () => {
    if (request.requestType === 'Permission') {
      if (request.fromTime && request.toTime) {
        const [fromHour, fromMinute] = request.fromTime.split(':').map(Number);
        const [toHour, toMinute] = request.toTime.split(':').map(Number);
        const fromMinutes = fromHour * 60 + fromMinute;
        const toMinutes = toHour * 60 + toMinute;
        const diffMinutes = toMinutes - fromMinutes;
        
        if (diffMinutes >= 60) {
          return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
        } else {
          return `${diffMinutes}m`;
        }
      }
      return 'N/A';
    } else {
      if (!request.toDate) return '1 day';
      const diffTime = Math.abs(request.toDate.getTime() - request.fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} days`;
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  return (
    <>
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {isDirector && (
                <View style={styles.userInfo}>
                  <User size={16} color="#6B7280" />
                  <Text style={styles.userName}>
                    {request.userName}
                  </Text>
                </View>
              )}
              <Text style={styles.department}>
                {request.department} • ID: {request.empId}
              </Text>
            </View>
            <StatusBadge status={request.status} />
          </View>

          <View style={styles.leaveTypeContainer}>
            <View style={styles.leaveTypeLeft}>
              <Text style={styles.leaveType}>
                {request.requestType === 'Permission' ? 'Permission' : `${request.leaveType} Leave`}
              </Text>
              <Text style={styles.requestType}>
                {request.requestType}
              </Text>
            </View>
            <View style={styles.daysContainer}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.daysText}>{calculateDuration()}</Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>
              {request.requestType === 'Permission' ? 'Date & Time' : 'Duration'}
            </Text>
            {request.requestType === 'Permission' ? (
              <Text style={styles.dateValue}>
                {formatDate(request.fromDate)} • {formatTime(request.fromTime || '')} - {formatTime(request.toTime || '')}
              </Text>
            ) : (
              <Text style={styles.dateValue}>
                {formatDate(request.fromDate)}{request.toDate && request.toDate.getTime() !== request.fromDate.getTime() ? ` → ${formatDate(request.toDate)}` : ''}
              </Text>
            )}
          </View>
          
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reasonText}>{request.reason}</Text>
          </View>

          {request.fileUrl && (
            <View style={styles.fileContainer}>
              <FileText size={16} color="#3B82F6" />
              <Text style={styles.fileText}>Supporting document attached</Text>
            </View>
          )}

          {request.remark && (
            <View style={styles.remarkContainer}>
              <Text style={styles.remarkLabel}>Director's Remark</Text>
              <Text style={styles.remarkText}>{request.remark}</Text>
            </View>
          )}
        </CardContent>

        {isDirector && request.status === 'Pending' && (
          <CardFooter style={styles.footer}>
            <View style={styles.buttonRow}>
              <Button
                title="Approve"
                onPress={handleApprove}
                variant="success"
                size="sm"
                icon={<Check size={16} color="white" />}
                loading={loading}
                style={styles.actionButton}
              />
              <Button
                title="Reject"
                onPress={() => setShowRejectModal(true)}
                variant="danger"
                size="sm"
                icon={<X size={16} color="white" />}
                style={styles.actionButton}
              />
            </View>
          </CardFooter>
        )}
      </Card>

      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Leave Request</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting this request
            </Text>
            <Input
              label="Reason for rejection"
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={4}
              placeholder="Enter your reason here..."
              containerStyle={styles.remarkInput}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowRejectModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Reject Request"
                onPress={handleReject}
                variant="danger"
                loading={loading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 6,
  },
  department: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  leaveTypeLeft: {
    flexDirection: 'column',
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  requestType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  reasonContainer: {
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginBottom: 16,
  },
  fileText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 8,
    fontWeight: '500',
  },
  remarkContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  remarkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  remarkText: {
    fontSize: 15,
    color: '#7F1D1D',
    lineHeight: 22,
  },
  footer: {
    backgroundColor: '#FAFAFA',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  remarkInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});