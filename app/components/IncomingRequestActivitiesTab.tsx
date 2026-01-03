import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Activity {
  id: string;
  description: string;
  bookServiceId: string;
  status: string;
  user_id: string;
  user: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    phone: number;
    userNumber: string;
  };
  createdAt: number;
  updatedAt: number;
}

interface IncomingRequestActivitiesTabProps {
  bookedServiceId: string;
  isCompleted?: boolean;
}

const IncomingRequestActivitiesTab: React.FC<IncomingRequestActivitiesTabProps> = ({
  bookedServiceId,
  isCompleted = false,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Activity[]>(
        `/en/auth/book/service/${bookedServiceId}/processes`,
        {
          requiresAuth: true,
        }
      );

      setActivities(response.data || []);
    } catch (err: any) {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [bookedServiceId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return 'checkmark-circle';
      case 'REJECTED':
        return 'close-circle';
      case 'COMPLETED':
        return 'checkmark-done-circle';
      default:
        return 'time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return colors.primary.green;
      case 'REJECTED':
        return colors.semantic.error;
      case 'COMPLETED':
        return colors.semantic.success;
      default:
        return colors.neutral.gray.medium;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={48} color={colors.neutral.gray.light} />
        <Text style={styles.emptyText}>No activities found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.timeline}>
        {activities.map((activity, index) => (
          <View key={activity.id} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.timelineIcon,
                  { backgroundColor: getStatusColor(activity.status) + '20' },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(activity.status) as any}
                  size={20}
                  color={getStatusColor(activity.status)}
                />
              </View>
              {index < activities.length - 1 && <View style={styles.timelineLine} />}
            </View>

            <View style={styles.timelineContent}>
              <View style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={styles.activityHeaderLeft}>
                    <Text style={styles.activityUser}>
                      {activity.user.firstName} {activity.user.lastName}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(activity.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[styles.statusBadgeText, { color: getStatusColor(activity.status) }]}
                      >
                        {activity.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activityDate}>
                    {formatDateTime(activity.createdAt)}
                  </Text>
                </View>

                {activity.description && (
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                )}

                <View style={styles.activityMeta}>
                  <View style={styles.activityMetaItem}>
                    <Ionicons name="mail-outline" size={14} color={colors.neutral.gray.medium} />
                    <Text style={styles.activityMetaText}>{activity.user.email}</Text>
                  </View>
                  <View style={styles.activityMetaItem}>
                    <Ionicons name="id-card-outline" size={14} color={colors.neutral.gray.medium} />
                    <Text style={styles.activityMetaText}>{activity.user.userNumber}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default IncomingRequestActivitiesTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.neutral.gray.lighter,
    marginTop: 8,
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
  },
  activityCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityHeaderLeft: {
    flex: 1,
    gap: 8,
  },
  activityUser: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
  },
  activityDate: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityMetaText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
});

