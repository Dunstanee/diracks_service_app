import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface BookingHistory {
  id: string;
  bookCode: string;
  description: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  priceId: string | null;
  bookedDate: number;
  acceptedDate: number | null;
  isAccepted: boolean;
  isActive: boolean;
  isHomeWorkRequest: boolean;
  isCancelled: boolean;
  isDeclined: boolean;
  isCompleted: boolean;
  completedDate: number | null;
  organization: {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    isServiceProvider: boolean;
    createdAt: number;
    updatedAt: number;
  };
  service: {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    isPublic: boolean;
    isDeleted: boolean;
    modeId: number;
    staffId: string;
    thumbNailId: string | null;
    thumbNail: {
      id: string;
      name: string;
      systemName: string;
      fileSize: number;
      mimeType: string;
      fileSource: string;
      userId: string;
      deleted: boolean;
      createdAt: number;
      updatedAt: number;
    } | null;
    mode: {
      id: number;
      name: string;
      isActive: boolean;
      createdAt: number;
      updatedAt: number;
    };
    createdAt: number;
    updatedAt: number;
  };
  branch: {
    id: string;
    organizationId: string;
    isMain: boolean;
    name: string;
    longitude: number;
    latitude: number;
    accuracy: number | null;
    contact: number;
    description: string;
    email: string;
    stateProvince: string;
    city: string;
    location: string;
    slotsId: string | null;
    createdAt: number;
    updatedAt: number;
  };
  customer: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    phone: number;
    country: string;
    userNumber: string;
    gender: number;
    birthDate: string;
    verified: boolean;
    active: boolean;
    createdAt: number;
    updatedAt: number;
  };
  createdAt: number;
  updatedAt: number;
}

const BookingHistory = () => {
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const getImageUri = useCallback(async (systemName: string, bookingId: string): Promise<void> => {
    if (imageUris[bookingId] || loadingImages.has(systemName) || failedImages.has(systemName)) {
      return;
    }

    setLoadingImages((prev) => new Set(prev).add(systemName));

    try {
      const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN || process.env.API_DOMAIN || '';
      const authToken = useAuthStore.getState().token;

      const response = await fetch(`${API_DOMAIN}/file/resource/${systemName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        setFailedImages((prev) => new Set(prev).add(systemName));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
        return;
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageUris((prev) => ({ ...prev, [bookingId]: dataUri }));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
      };
      reader.onerror = () => {
        setFailedImages((prev) => new Set(prev).add(systemName));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load image:', err);
      setFailedImages((prev) => new Set(prev).add(systemName));
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(systemName);
        return next;
      });
    }
  }, [imageUris, loadingImages, failedImages]);

  const fetchBookingHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<BookingHistory[]>('/en/on/book/service/histories', {
        requiresAuth: true,
      });

      const sortedBookings = (response.data || []).sort(
        (a, b) => (b.bookedDate || 0) - (a.bookedDate || 0)
      );

      setBookings(sortedBookings);
      setFilteredBookings(sortedBookings);

      // Load images for bookings with thumbnails
      sortedBookings.forEach((booking) => {
        if (booking.service.thumbNail?.systemName) {
          getImageUri(booking.service.thumbNail.systemName, booking.id);
        }
      });
    } catch (err: any) {
      console.error('Failed to fetch booking history:', err);
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [getImageUri]);

  useEffect(() => {
    fetchBookingHistory();
  }, [fetchBookingHistory]);

  useEffect(() => {
    // Filter bookings based on search query
    if (searchQuery.trim() === '') {
      setFilteredBookings(bookings);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = bookings.filter(
        (booking) =>
          booking.bookCode.toLowerCase().includes(query) ||
          booking.service.name.toLowerCase().includes(query) ||
          booking.customer.firstName.toLowerCase().includes(query) ||
          booking.customer.lastName.toLowerCase().includes(query) ||
          booking.branch.name.toLowerCase().includes(query)
      );
      setFilteredBookings(filtered);
    }
  }, [searchQuery, bookings]);

  const getStatusBadge = (booking: BookingHistory) => {
    if (booking.isCompleted) {
      return {
        label: 'Completed',
        color: colors.primary.green,
        bgColor: colors.primary.greenLight + '20',
      };
    }
    if (booking.isCancelled) {
      return {
        label: 'Cancelled',
        color: colors.semantic.error,
        bgColor: colors.semantic.error + '20',
      };
    }
    if (booking.isDeclined) {
      return {
        label: 'Declined',
        color: colors.semantic.warning,
        bgColor: colors.semantic.warning + '20',
      };
    }
    if (booking.isAccepted) {
      return {
        label: 'Ongoing',
        color: colors.semantic.info,
        bgColor: colors.semantic.info + '20',
      };
    }
    return {
      label: 'Pending',
      color: colors.secondary.orange,
      bgColor: colors.secondary.orangeLight + '20',
    };
  };

  const handleBookingPress = (booking: BookingHistory) => {
    router.push({
      pathname: '/IncomingRequestDetails',
      params: {
        requestId: booking.id,
      },
    });
  };

  const renderBookingItem = ({ item }: { item: BookingHistory }) => {
    const status = getStatusBadge(item);
    const customerName = `${item.customer.firstName} ${item.customer.lastName}`.trim();
    const hasThumbnail = item.service.thumbNail?.systemName;
    const imageUri = imageUris[item.id];
    const isLoadingImage = hasThumbnail && loadingImages.has(item.service.thumbNail!.systemName);
    const isFailedImage = hasThumbnail && failedImages.has(item.service.thumbNail!.systemName);

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleBookingPress(item)}
        activeOpacity={0.7}
      >
        {/* Service Image Cover */}
        <View style={styles.serviceImageContainer}>
          {isLoadingImage ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="small" color={colors.primary.green} />
            </View>
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.serviceImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="grid-outline" size={32} color={colors.neutral.gray.medium} />
            </View>
          )}
        </View>

        {/* Booking Content */}
        <View style={styles.bookingContent}>
          <View style={styles.bookingHeader}>
            <View style={styles.bookingHeaderLeft}>
              <View style={styles.bookCodeContainer}>
                <Ionicons name="receipt-outline" size={16} color={colors.primary.green} />
                <Text style={styles.bookCode}>{item.bookCode}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: status.bgColor },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.gray.medium} />
          </View>

          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {item.service.name}
            </Text>
            {item.service.mode && (
              <View style={styles.serviceFooter}>
                <View style={styles.serviceModeBadge}>
                  <Ionicons name="folder-outline" size={12} color={colors.primary.green} />
                  <Text style={styles.serviceModeText}>{item.service.mode.name}</Text>
                </View>
              </View>
            )}
          </View>

          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {customerName || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.branch?.name || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.dateText}>
                Booked: {formatDateTime(item.bookedDate)}
              </Text>
            </View>
            {item.completedDate && (
              <View style={styles.dateRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary.green} />
                <Text style={[styles.dateText, styles.completedDateText]}>
                  Completed: {formatDateTime(item.completedDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>Booking History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Field */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.neutral.gray.medium}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by book code, service, customer, or branch..."
            placeholderTextColor={colors.neutral.gray.medium}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.neutral.gray.medium} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Booking List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
          <Text style={styles.loadingText}>Loading booking history...</Text>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No bookings found' : 'No booking history available'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
              activeOpacity={0.7}
            >
              <Text style={styles.clearSearchText}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchBookingHistory}
        />
      )}
    </View>
  );
};

export default BookingHistory;

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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.gray.lightest,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bookingCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  serviceImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background.secondary,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  bookingContent: {
    padding: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bookCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookCode: {
    fontSize: 14,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
  },
  serviceInfo: {
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  serviceModeText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  description: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 120,
  },
  detailText: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    flex: 1,
  },
  dateContainer: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  completedDateText: {
    color: colors.primary.green,
    fontFamily: fonts.weights.medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.medium,
    marginTop: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
});
