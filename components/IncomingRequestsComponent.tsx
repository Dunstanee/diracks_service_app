import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useBranchStore } from '@/store/branchStore';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface IncomingRequest {
  id: string;
  bookCode: string;
  description: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  staffId: string | null;
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
  service: {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    isPublic: boolean;
    isDeleted: boolean;
    modeId: number;
    staffId: string;
    thumbNailId: string;
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

const IncomingRequestsComponent = () => {
  const { branch } = useBranchStore();
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [isLoadingIncomingRequests, setIsLoadingIncomingRequests] = useState(false);
  const incomingRequestsRef = useRef<FlatList>(null);

  const fetchIncomingRequests = useCallback(async () => {
    if (!branch?.id) {
      return;
    }

    setIsLoadingIncomingRequests(true);
    try {
      const response = await api.get<IncomingRequest[]>(
        `/en/on/book/services/branch/${branch.id}`,
        {
          requiresAuth: true,
        }
      );

      // Filter for incoming requests (new or ongoing, not cancelled, not declined, not completed)
      const incoming = (response.data || [])
        .filter(
          (req) =>
            !req.isCancelled &&
            !req.isDeclined &&
            !req.isCompleted &&
            req.isActive
        )
        .slice(0, 10); // Get first 10, but display at least 3

      setIncomingRequests(incoming);
    } catch (err: any) {
      console.error('Failed to fetch incoming requests:', err);
      setIncomingRequests([]);
    } finally {
      setIsLoadingIncomingRequests(false);
    }
  }, [branch?.id]);

  useEffect(() => {
    fetchIncomingRequests();
  }, [fetchIncomingRequests]);

  if (!branch?.id) {
    return null;
  }

  return (
    <View style={styles.incomingRequestsSection}>
      <View style={styles.incomingRequestsHeader}>
        <Text style={styles.incomingRequestsTitle}>Incoming Orders</Text>
        {incomingRequests.length > 0 && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => {
              router.push('/IncomingRequestList');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.viewMoreText}>View More</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary.green} />
          </TouchableOpacity>
        )}
      </View>

      {isLoadingIncomingRequests ? (
        <View style={styles.incomingRequestsLoading}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.incomingRequestCardSkeleton}>
              <Skeleton width="100%" height={200} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : incomingRequests.length === 0 ? (
        <View style={styles.incomingRequestsEmpty}>
          <Ionicons name="document-text-outline" size={48} color={colors.neutral.gray.light} />
          <Text style={styles.incomingRequestsEmptyText}>No incoming requests</Text>
        </View>
      ) : (
        <FlatList
          ref={incomingRequestsRef}
          data={incomingRequests}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={Dimensions.get('window').width - 80}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={styles.incomingRequestsList}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(event) => {
            // Track scroll position if needed in the future
            // const cardWidth = Dimensions.get('window').width - 80;
            // const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.incomingRequestCardWrapper}
              onPress={() => {
                router.push({
                  pathname: "/IncomingRequestDetails",
                  params: {
                    requestId: item.id,
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={require('@/assets/backgroud/incoming-background.png')}
                style={styles.incomingRequestCard}
                resizeMode="cover"
              >
                <View style={styles.incomingRequestCardOverlay}>
                  <View style={styles.incomingRequestCardHeader}>
                    <View style={styles.incomingRequestBookCode}>
                      <Ionicons name="receipt-outline" size={16} color={colors.text.inverse} />
                      <Text style={styles.incomingRequestBookCodeText}>{item.bookCode}</Text>
                    </View>
                    <View
                      style={[
                        styles.incomingRequestStatusBadge,
                        item.isAccepted
                          ? item.isCompleted
                            ? styles.incomingRequestStatusBadgeCompleted
                            : styles.incomingRequestStatusBadgeOngoing
                          : item.isCompleted
                            ? styles.incomingRequestStatusBadgeCompleted
                            : styles.incomingRequestStatusBadgeNew,
                      ]}
                    >
                      <Text
                        style={[
                          styles.incomingRequestStatusBadgeText,
                          item.isAccepted
                            ? styles.incomingRequestStatusBadgeTextOngoing
                            : item.isCompleted
                                ? styles.incomingRequestStatusBadgeTextCompleted
                                : styles.incomingRequestStatusBadgeTextNew,
                        ]}
                      >
                        {item.isAccepted && !item.isCompleted ? 'Ongoing' : item.isCompleted ? 'Completed' : 'New'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.incomingRequestDateContainer}>
                    <View style={styles.incomingRequestDate}>
                      <Ionicons name="time-outline" size={14} color={colors.text.inverse} />
                      <Text style={styles.incomingRequestDateText}>
                        {formatDateTime(item.bookedDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.incomingRequestContent}>
                    <View style={styles.incomingRequestService}>
                      <Ionicons name="construct-outline" size={20} color={colors.text.inverse} />
                      <Text style={styles.incomingRequestServiceText} numberOfLines={1}>
                        {item.service.name}
                      </Text>
                    </View>

                    <View style={styles.incomingRequestCustomer}>
                      <Ionicons name="person-outline" size={18} color={colors.text.inverse} />
                      <Text style={styles.incomingRequestCustomerText} numberOfLines={1}>
                        {item.customer.firstName} {item.customer.lastName}
                      </Text>
                    </View>

                    {item.description && (
                      <View style={styles.incomingRequestDescription}>
                        <Text style={styles.incomingRequestDescriptionText} numberOfLines={2}>
                          {item.description}
                        </Text>
                      </View>
                    )}

                    <View style={styles.incomingRequestBranch}>
                      <Ionicons name="location-outline" size={16} color={colors.text.inverse} />
                      <Text style={styles.incomingRequestBranchText} numberOfLines={1}>
                        {item.branch.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.incomingRequestChevron}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text.inverse} />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default IncomingRequestsComponent;

const styles = StyleSheet.create({
  incomingRequestsSection: {
    marginBottom: 24,
  },
  incomingRequestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  incomingRequestsTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewMoreText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  incomingRequestsList: {
    paddingLeft: 5,
    paddingRight: 5,
  },
  incomingRequestCardWrapper: {
    width: Dimensions.get('window').width - 50,
    marginRight: 10,
  },
  incomingRequestCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    minHeight: 200,
  },
  incomingRequestCardOverlay: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flex: 1,
    justifyContent: 'space-between',
    position: 'relative',
  },
  incomingRequestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incomingRequestBookCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  incomingRequestBookCodeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  incomingRequestStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  incomingRequestStatusBadgeNew: {
    backgroundColor: colors.semantic.info + 'CC',
  },
  incomingRequestStatusBadgeOngoing: {
    backgroundColor: colors.secondary.orange + 'CC',
  },
  incomingRequestStatusBadgeCompleted: {
    backgroundColor: colors.primary.green + 'CC',
  },
  incomingRequestStatusBadgeTextCompleted: {
    color: colors.text.inverse,
  },
  incomingRequestStatusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
  },
  incomingRequestStatusBadgeTextNew: {
    color: colors.text.inverse,
  },
  incomingRequestStatusBadgeTextOngoing: {
    color: colors.text.inverse,
  },
  incomingRequestDateContainer: {
    marginBottom: 8,
  },
  incomingRequestDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  incomingRequestDateText: {
    fontSize: 11,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  incomingRequestContent: {
    flex: 1,
    gap: 12,
  },
  incomingRequestService: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incomingRequestServiceText: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    flex: 1,
  },
  incomingRequestCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incomingRequestCustomerText: {
    fontSize: 15,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
    flex: 1,
  },
  incomingRequestDescription: {
    marginTop: 4,
  },
  incomingRequestDescriptionText: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.9,
    lineHeight: 18,
  },
  incomingRequestBranch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  incomingRequestBranchText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.8,
    flex: 1,
  },
  incomingRequestChevron: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 6,
  },
  incomingRequestsLoading: {
    flexDirection: 'row',
    gap: 12,
  },
  incomingRequestCardSkeleton: {
    width: Dimensions.get('window').width - 60,
    marginRight: 12,
  },
  incomingRequestsEmpty: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  incomingRequestsEmptyText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginTop: 8,
  },
});

