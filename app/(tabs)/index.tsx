import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { LeaveRequestCard } from '@/components/LeaveRequestCard';
import { getCurrentUser } from '@/lib/auth';
import { getLeaveRequests, LeaveRequest } from '@/lib/firestore';
import { router } from 'expo-router';
import { Plus, FileText } from 'lucide-react-native';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Staff' | 'Director';
  department: string;
}

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadRequests(currentUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (currentUser: User) => {
    try {
      let requestsData;
      if (currentUser.role === 'Staff') {
        requestsData = await getLeaveRequests(currentUser.id);
      } else {
        requestsData = await getLeaveRequests();
      }
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleRequestUpdate = () => {
    if (user) {
      loadRequests(user);
    }
  };

  if (loading) {
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>
              Welcome, {user?.name}
            </Text>
            <Text style={styles.roleText}>
              {user?.department} • {user?.role}
            </Text>
          </View>

          {/* Quick Actions */}
          {user?.role === 'Staff' && (
            <Card style={styles.quickActionsCard}>
              <CardContent>
                <Button
                  title="Submit Leave Request"
                  onPress={() => router.push('/submit')}
                  icon={<Plus size={20} color="white" />}
                />
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <Text style={styles.statNumber}>
                  {requests.length}
                </Text>
                <Text style={styles.statLabel}>
                  {user?.role === 'Director' ? 'Total Requests' : 'My Requests'}
                </Text>
              </CardContent>
            </Card>
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <Text style={[styles.statNumber, styles.pendingNumber]}>
                  {requests.filter(r => r.status === 'Pending').length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </CardContent>
            </Card>
          </View>

          {/* Requests List */}
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>
              {user?.role === 'Director' ? 'All Leave Requests' : 'My Leave Requests'}
            </Text>
            
            {requests.length === 0 ? (
              <Card>
                <CardContent style={styles.emptyState}>
                  <FileText size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>
                    {user?.role === 'Director' 
                      ? 'No leave requests found' 
                      : 'You haven\'t submitted any leave requests yet'
                    }
                  </Text>
                </CardContent>
              </Card>
            ) : (
              <View>
                {requests.map((request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    isDirector={user?.role === 'Director'}
                    onUpdate={handleRequestUpdate}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#6B7280',
  },
  quickActionsCard: {
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  pendingNumber: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  requestsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 16,
  },
});