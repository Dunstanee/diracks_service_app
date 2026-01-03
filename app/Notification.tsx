import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Notification {
  id: string;
  type: 'share' | 'security' | 'hack' | 'request' | 'promotion';
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
}

const Notification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dummy data
  const dummyNotifications: Notification[] = [
    {
      id: '1',
      type: 'share',
      icon: 'person-circle-outline',
      iconColor: colors.primary.green,
      title: 'Zoey shared a new item with you',
      body: "You can now connect with Zoey's credential to Netflix.com",
      timestamp: 'Just now',
      isRead: false,
    },
    {
      id: '2',
      type: 'security',
      icon: 'lock-closed-outline',
      iconColor: colors.semantic.info,
      title: 'Check your passwords score',
      body: "It's been a while since you changed your passwords. Time to check your score!",
      timestamp: '2 hours ago',
      isRead: false,
    },
    {
      id: '3',
      type: 'hack',
      icon: 'warning-outline',
      iconColor: colors.semantic.error,
      title: 'Spotify.com was hacked!',
      body: "Take a deep breath, it's not that bad as it sounds. You need to update your password",
      timestamp: '1 day ago',
      isRead: true,
    },
    {
      id: '4',
      type: 'request',
      icon: 'person-circle-outline',
      iconColor: colors.primary.green,
      title: 'Laura asked for sharing',
      body: 'Laura asked you to share your Airbnb.com account with her.',
      timestamp: '1 day ago',
      isRead: true,
    },
    {
      id: '5',
      type: 'promotion',
      icon: 'star-outline',
      iconColor: colors.secondary.orange,
      title: 'Get Premium for free!',
      body: "It's a once in a lifetime offer! You get Premium for 30 days... for free.",
      timestamp: '4 days ago',
      isRead: true,
    },
  ];

  const fetchNotifications = useCallback(async () => {
    // Simulate API call
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setNotifications(dummyNotifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setNotifications(dummyNotifications);
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadCard,
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.iconColor + '15' },
            ]}
          >
            <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
              {item.title}
            </Text>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {item.body}
            </Text>
            <View style={styles.timestampContainer}>
              <Ionicons name="time-outline" size={12} color={colors.text.secondary} />
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletonItem = () => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationContent}>
        <Skeleton width={48} height={48} circle />
        <View style={styles.textContainer}>
          <Skeleton width="80%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={14} borderRadius={6} style={{ marginBottom: 4 }} />
          <Skeleton width="60%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyGraphic}>
        <View style={styles.emptyCircle} />
        <View style={[styles.emptyCard, styles.emptyCard1]}>
          <View style={styles.emptyCardAvatar} />
          <View style={styles.emptyCardLines}>
            <View style={styles.emptyCardLine1} />
            <View style={styles.emptyCardLine2} />
          </View>
        </View>
        <View style={[styles.emptyCard, styles.emptyCard2]}>
          <View style={styles.emptyCardAvatar} />
          <View style={styles.emptyCardLines}>
            <View style={styles.emptyCardLine1} />
            <View style={styles.emptyCardLine2} />
          </View>
        </View>
        <View style={[styles.emptyCard, styles.emptyCard3]}>
          <View style={styles.emptyCardAvatar} />
          <View style={styles.emptyCardLines}>
            <View style={styles.emptyCardLine1} />
            <View style={styles.emptyCardLine2} />
          </View>
        </View>
      </View>
      <Text style={styles.emptyTitle}>There's nothing here</Text>
      <Text style={styles.emptySubtitle}>
        We'll inform you when there's something new.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <FlatList
          data={Array.from({ length: 5 })}
          renderItem={renderSkeletonItem}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary.green]}
              tintColor={colors.primary.green}
            />
          }
        />
      )}
    </View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.green,
    backgroundColor: colors.primary.greenLight + '05',
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  unreadTitle: {
    color: colors.text.primary,
  },
  notificationBody: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyGraphic: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.neutral.gray.light,
    position: 'absolute',
  },
  emptyCard: {
    width: 90,
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.background.primary,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  emptyCardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral.gray.lighter,
  },
  emptyCardLines: {
    flex: 1,
    gap: 6,
  },
  emptyCardLine1: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral.gray.lighter,
    width: '80%',
  },
  emptyCardLine2: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral.gray.lighter,
    width: '60%',
  },
  emptyCard1: {
    top: 10,
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  emptyCard2: {
    left: 10,
    bottom: 30,
    transform: [{ rotate: '-15deg' }],
  },
  emptyCard3: {
    bottom: 10,
    right: 30,
    transform: [{ rotate: '5deg' }],
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
