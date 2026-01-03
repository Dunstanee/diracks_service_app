import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface ServiceMode {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ThumbNail {
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
}

interface Staff {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: number;
  country: string | null;
  userNumber: string;
  gender: number;
  birthDate: string;
  verified: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ServiceDetails {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isPublic: boolean;
  isDeleted: boolean;
  modeId: number;
  staffId: string;
  thumbNailId: string | null;
  thumbNail: ThumbNail | null;
  staff: Staff;
  mode: ServiceMode;
  createdAt: number;
  updatedAt: number;
}

interface Tag {
  id: string;
  serviceId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface Pricing {
  id: string;
  name: string;
  description: string;
  amount: number;
  discount: number;
  organizationId: string;
  serviceId: string;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
}

const ServiceDetailsSummary = () => {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [isLoadingPricings, setIsLoadingPricings] = useState(false);

  const getImageUri = useCallback(async (systemName: string): Promise<void> => {
    setIsLoadingBanner(true);
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
        setIsLoadingBanner(false);
        return;
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setBannerUri(dataUri);
        setIsLoadingBanner(false);
      };
      reader.onerror = () => {
        setIsLoadingBanner(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setIsLoadingBanner(false);
    }
  }, []);

  const fetchServiceDetails = useCallback(async () => {
    if (!serviceId) {
      setError('Service ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<ServiceDetails>(`/en/on/service/${serviceId}`, {
        requiresAuth: true,
      });

      const serviceData = response.data;
      setService(serviceData);

      // Load banner image if thumbnail exists
      if (serviceData.thumbNail?.systemName) {
        getImageUri(serviceData.thumbNail.systemName);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load service details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, getImageUri]);

  useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  const fetchTags = useCallback(async () => {
    if (!serviceId) return;

    setIsLoadingTags(true);
    try {
      const response = await api.get<Tag[]>(`/en/on/service/${serviceId}/tags`, {
        requiresAuth: true,
      });
      setTags(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch tags:', err);
      setTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  }, [serviceId]);

  const fetchPricings = useCallback(async () => {
    if (!serviceId) return;

    setIsLoadingPricings(true);
    try {
      const response = await api.get<Pricing[]>(`/en/on/service/${serviceId}/pricing`, {
        requiresAuth: true,
      });
      setPricings(response.data || []);
    } catch (err: any) {
      setPricings([]);
    } finally {
      setIsLoadingPricings(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId && service) {
      fetchTags();
      fetchPricings();
    }
  }, [serviceId, service, fetchTags, fetchPricings]);



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  if (error || !service) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error || 'Service not found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchServiceDetails}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const defaultBanner = require('@/assets/backgroud/default-banner.png');

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner with Overlay Content */}
      <View style={styles.bannerContainer}>
        {isLoadingBanner ? (
          <Skeleton width="100%" height={300} borderRadius={0} />
        ) : bannerUri ? (
          <ImageBackground
            source={{ uri: bannerUri }}
            style={styles.banner}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
              style={styles.bannerGradient}
            />
            <View style={styles.bannerContent}>
              <View style={styles.bannerHeader}>
                <TouchableOpacity
                  style={styles.backButtonHeader}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
                </TouchableOpacity>
              </View>
              <View style={styles.bannerInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescriptionBanner} numberOfLines={3}>
                  {service.description}
                </Text>
                <View style={styles.modeBadgeBanner}>
                  <Ionicons name="folder-outline" size={16} color={colors.text.inverse} />
                  <Text style={styles.modeTextBanner}>{service.mode.name}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <ImageBackground
            source={defaultBanner}
            style={styles.banner}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
              style={styles.bannerGradient}
            />
            <View style={styles.bannerContent}>
              <View style={styles.bannerHeader}>
                <TouchableOpacity
                  style={styles.backButtonHeader}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
                </TouchableOpacity>
              </View>
              <View style={styles.bannerInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescriptionBanner} numberOfLines={3}>
                  {service.description}
                </Text>
                <View style={styles.modeBadgeBanner}>
                  <Ionicons name="folder-outline" size={16} color={colors.text.inverse} />
                  <Text style={styles.modeTextBanner}>{service.mode.name}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        )}
      </View>

      {/* Content Below Banner */}
      <View style={styles.content}>
        {/* Visibility Badge */}
        <View style={styles.visibilitySection}>
          <View
            style={[
              styles.visibilityBadge,
              service.isPublic ? styles.publicBadge : styles.privateBadge
            ]}
          >
            <Ionicons
              name={service.isPublic ? "globe-outline" : "lock-closed"}
              size={14}
              color={service.isPublic ? colors.primary.green : colors.neutral.gray.dark}
            />
            <Text
              style={[
                styles.visibilityBadgeText,
                service.isPublic ? styles.publicBadgeText : styles.privateBadgeText
              ]}
            >
              {service.isPublic ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>

        {/* Pricing */}
        {pricings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.pricingContainer}>
              {isLoadingPricings ? (
                <ActivityIndicator size="small" color={colors.primary.green} />
              ) : (
                pricings.map((pricing) => (
                  <View key={pricing.id} style={styles.pricingItem}>
                    <View style={styles.pricingHeader}>
                      <Text style={styles.pricingName}>{pricing.name}</Text>
                      <View style={styles.pricingAmountContainer}>
                        {pricing.discount > 0 && (
                          <Text style={styles.pricingOriginalAmount}>
                            ${pricing.amount.toFixed(2)}
                          </Text>
                        )}
                        <Text style={styles.pricingAmount}>
                          ${(pricing.amount - pricing.discount).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    {pricing.description && (
                      <Text style={styles.pricingDescription}>{pricing.description}</Text>
                    )}
                    {pricing.discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          ${pricing.discount.toFixed(2)} discount
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {isLoadingTags ? (
                <ActivityIndicator size="small" color={colors.primary.green} />
              ) : (
                tags.map((tag) => (
                  <View key={tag.id} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{tag.name}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Created By and Date - Last Section */}
        <View style={styles.metadataSection}>
          <View style={styles.staffContainer}>
            <View style={styles.staffAvatar}>
              <Text style={styles.staffInitials}>
                {service.staff.firstName.charAt(0)}
                {service.staff.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={styles.metadataLabel}>Created By</Text>
              <Text style={styles.staffName}>
                {service.staff.firstName} {service.staff.lastName}
              </Text>
              <Text style={styles.staffEmail}>{service.staff.email}</Text>
            </View>
          </View>
          <View style={styles.dateContainer}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.neutral.gray.medium} />
              <Text style={styles.metadataText}>
                Created: {formatDate(service.createdAt)}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={16} color={colors.neutral.gray.medium} />
              <Text style={styles.metadataText}>
                Updated: {formatDate(service.updatedAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default ServiceDetailsSummary;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Banner
  bannerContainer: {
    width: '100%',
    height: 300,
  },
  banner: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  bannerInfo: {
    marginTop: 'auto',
  },
  serviceName: {
    fontSize: 32,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    marginBottom: 12,
  },
  serviceDescriptionBanner: {
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.95,
  },
  modeBadgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeTextBanner: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  // Content
  content: {
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  visibilitySection: {
    marginBottom: 24,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  publicBadge: {
    backgroundColor: colors.primary.greenLight + '20',
  },
  privateBadge: {
    backgroundColor: colors.neutral.gray.lighter,
  },
  visibilityBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
  },
  publicBadgeText: {
    color: colors.primary.green,
  },
  privateBadgeText: {
    color: colors.neutral.gray.dark,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  staffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  staffAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInitials: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  addButton: {
    padding: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary.greenLight,
  },
  tagBadgeText: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.primary.green,
  },
  pricingContainer: {
    gap: 12,
  },
  pricingItem: {
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    marginBottom: 12,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pricingName: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  pricingAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricingAmount: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
  },
  pricingOriginalAmount: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    textDecorationLine: 'line-through',
  },
  pricingDescription: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 8,
    lineHeight: 20,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary.orangeLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  discountText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.secondary.orange,
  },
  pricingActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  pricingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  pricingActionButton: {
    backgroundColor: colors.primary.greenLight + '20',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pricingUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary.green,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    shadowColor: colors.primary.green,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingUpdateButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  pricingDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.semantic.error,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    shadowColor: colors.semantic.error,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingDeleteButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  emptyPricingText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    fontStyle: 'italic',
  },
  metadataSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
    gap: 20,
  },
  metadataLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  dateContainer: {
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  // Loading States
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primary.green,
  },
  bannerSkeleton: {
    marginBottom: 0,
  },
  contentSkeleton: {
    padding: 20,
  },
  titleSkeleton: {
    marginBottom: 16,
  },
  textSkeleton: {
    marginBottom: 8,
  },
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.neutral.gray.lighter,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.primary.green,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 24,
    lineHeight: 20,
  },
  visibilityOptions: {
    gap: 12,
    marginBottom: 20,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral.gray.lighter,
    backgroundColor: colors.background.secondary,
    gap: 12,
  },
  visibilityOptionActive: {
    borderColor: colors.primary.green,
    backgroundColor: colors.primary.green,
  },
  visibilityOptionContent: {
    flex: 1,
  },
  visibilityOptionTitle: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  visibilityOptionTitleActive: {
    color: colors.text.inverse,
  },
  visibilityOptionDescription: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  visibilityOptionDescriptionActive: {
    color: colors.text.inverse + 'CC',
  },
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalLoadingText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.primary.green,
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.neutral.gray.lighter,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  // Tag Modal Styles
  tagInputContainer: {
    marginBottom: 20,
  },
  tagInput: {
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  tagModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tagModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  tagModalCancelButton: {
    backgroundColor: colors.neutral.gray.lighter,
  },
  tagModalCancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  tagModalSaveButton: {
    backgroundColor: colors.primary.green,
  },
  tagModalSaveButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Pricing Modal Styles
  pricingFormContainer: {
    marginBottom: 20,
  },
  pricingFormField: {
    marginBottom: 16,
  },
  pricingFormLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  pricingFormInput: {
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  pricingFormTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pricingFormRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pricingFormInputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
  },
  pricingFormPrefix: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    paddingLeft: 16,
    paddingRight: 8,
  },
  pricingFormInputNoBorder: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  pricingSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.primary.greenLight + '20',
    borderRadius: 8,
    marginTop: 8,
  },
  pricingSummaryLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  pricingSummaryAmount: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
  },
});
