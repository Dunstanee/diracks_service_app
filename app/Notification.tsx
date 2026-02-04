import Shimmer from '@/components/Shimmer'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { colors } from '../constants/colors'
import { fonts } from '../constants/fonts'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  time: string
  isRead: boolean
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNotifications = useCallback(async () => {
    // Simulate API call with dummy data
    // We only show loading state on initial load, not on refresh (refresh control handles that)
    if (notifications.length === 0) setLoading(true)

    setTimeout(() => {
      const dummyNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          message: 'Your booking BKS-42619V26 has been accepted by Diracks Operation Center',
          time: '2 hours ago',
          isRead: false,
        },
        {
          id: '2',
          type: 'info',
          message: 'Invoice AIZ-1767618714-26 has been generated for your service',
          time: '5 hours ago',
          isRead: false,
        },
        {
          id: '3',
          type: 'warning',
          message: 'Your payment for invoice IXH-1767619705-26 is pending',
          time: '1 day ago',
          isRead: true,
        },
        {
          id: '4',
          type: 'success',
          message: 'Service V8 Mustang Engine 2025 has been completed successfully',
          time: '2 days ago',
          isRead: true,
        },
        {
          id: '5',
          type: 'error',
          message: 'Your booking request was declined. Please try again',
          time: '3 days ago',
          isRead: true,
        },
        {
          id: '6',
          type: 'info',
          message: 'New service available: Battery Replacement 2',
          time: '1 week ago',
          isRead: true,
        },
        {
          id: '7',
          type: 'success',
          message: 'Your profile has been updated successfully',
          time: '1 week ago',
          isRead: true,
        },
        {
          id: '8',
          type: 'info',
          message: 'Reminder: Your service appointment is scheduled for tomorrow',
          time: '2 weeks ago',
          isRead: true,
        },
      ]
      setNotifications(dummyNotifications)
      setLoading(false)
      setRefreshing(false)
    }, 1000)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const onRefresh = () => {
    setRefreshing(true)
    fetchNotifications()
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'checkmark-circle'
      case 'error': return 'close-circle'
      case 'warning': return 'alert-circle'
      case 'info':
      default: return 'information-circle'
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return colors.semantic.success
      case 'error': return colors.semantic.error
      case 'warning': return colors.semantic.warning
      case 'info':
      default: return colors.semantic.info
    }
  }

  const renderItem: ListRenderItem<Notification> = ({ item }) => {
    const iconColor = getNotificationColor(item.type)
    const iconName = getNotificationIcon(item.type)

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadItem
        ]}
        onPress={() => handleMarkAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.messageText, !item.isRead && styles.unreadMessageText]}>
            {item.message}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        {!item.isRead && (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-off-outline" size={32} color={colors.neutral.gray.medium} />
      </View>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>You don't have any notifications right now.</Text>
    </View>
  )

  const renderShimmer = () => (
    <View style={styles.listContent}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.shimmerItem}>
          <Shimmer width={48} height={48} borderRadius={24} style={{ marginRight: 16 }} />
          <View style={{ flex: 1 }}>
            <Shimmer width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <Shimmer width="40%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  )

  return (
    <>
    
      {loading ? (
        renderShimmer()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.flexGrow
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.green}
              colors={[colors.primary.green]}
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </>
  )
}

export default Notifications

const styles = StyleSheet.create({
  flexGrow: {
    flexGrow: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral.gray.lightest,
    marginLeft: 80,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background.primary,
  },
  unreadItem: {
    backgroundColor: colors.primary.green + '05', // Very subtle green tint
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 8,
  },
  messageText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  unreadMessageText: {
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  timeText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.green,
    marginTop: 6,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral.gray.lightest,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
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
  // Shimmer
  shimmerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lightest,
  }
})

