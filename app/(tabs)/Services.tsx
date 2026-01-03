import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

interface Service {
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
  mode: ServiceMode;
  createdAt: number;
  updatedAt: number;
}

// Memoized Service Card Component
interface ServiceCardProps {
  service: Service;
  imageUri: string | null;
  isLoadingImage: boolean;
  isFailedImage: boolean;
  onLoadImage?: () => void;
  onView: (service: Service) => void;
  onDelete: (service: Service) => void;
}

const ServiceCard = memo<ServiceCardProps>(({
  service,
  imageUri,
  isLoadingImage,
  isFailedImage,
  onLoadImage,
  onView,
  onDelete,
}) => {
  // Trigger image load on mount if needed
  React.useEffect(() => {
    if (onLoadImage && !imageUri && !isLoadingImage && !isFailedImage) {
      onLoadImage();
    }
  }, [onLoadImage, imageUri, isLoadingImage, isFailedImage]);

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.7}
      onPress={() => onView(service)}
    >
      {/* Service Thumbnail or Icon */}
      <View style={styles.serviceImageContainer}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        ) : isLoadingImage ? (
          <Skeleton
            width="100%"
            height="100%"
            borderRadius={12}
          />
        ) : isFailedImage || service.thumbNail ? (
          <View style={styles.serviceIconContainer}>
            <Ionicons
              name="construct-outline"
              size={32}
              color={colors.primary.green}
            />
          </View>
        ) : (
          <View style={styles.serviceIconContainer}>
            <Ionicons
              name="construct-outline"
              size={32}
              color={colors.primary.green}
            />
          </View>
        )}
      </View>

      {/* Service Content */}
      <View style={styles.serviceContent}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {service.name}
          </Text>
          {!service.isPublic && (
            <View style={styles.privateBadge}>
              <Text style={styles.privateBadgeText}>Private</Text>
            </View>
          )}
          {service.isPublic && (
            <View style={styles.publicBadge}>
              <Text style={styles.publicBadgeText}>Public</Text>
            </View>
          )}
        </View>

        <Text style={styles.serviceDescription} numberOfLines={2}>
          {service.description}
        </Text>

        <View style={styles.serviceFooter}>
          <View style={styles.modeContainer}>
            <Ionicons
              name="folder-outline"
              size={14}
              color={colors.neutral.gray.medium}
            />
            <Text style={styles.modeText}>{service.mode.name}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onView(service)}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.primary.green} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.service.id === nextProps.service.id &&
    prevProps.imageUri === nextProps.imageUri &&
    prevProps.isLoadingImage === nextProps.isLoadingImage &&
    prevProps.isFailedImage === nextProps.isFailedImage
  );
});

ServiceCard.displayName = 'ServiceCard';

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Filter services based on search query
    if (searchQuery.trim() === '') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.mode.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  const getImageUri = useCallback(async (systemName: string): Promise<void> => {
    // Check cache first
    if (imageUris[systemName]) {
      return;
    }

    // If already loading or failed, don't start another request
    if (loadingImages.has(systemName) || failedImages.has(systemName)) {
      return;
    }

    // Mark as loading
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
        // Handle 404 or other errors - mark as failed
        if (response.status === 404) {
          setFailedImages((prev) => new Set(prev).add(systemName));
        }
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
        return;
      }

      // Convert blob to data URI
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageUris((prev) => ({ ...prev, [systemName]: dataUri }));
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
      // Mark as failed on error
      setFailedImages((prev) => new Set(prev).add(systemName));
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(systemName);
        return next;
      });
    }
  }, [imageUris, loadingImages, failedImages]);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Service[]>('/en/on/services', {
        requiresAuth: true,
      });

      const servicesData = response.data || [];
      setServices(servicesData);
      setFilteredServices(servicesData);

      // Pre-fetch images asynchronously (non-blocking)
      // Images will load in the background and update when ready
      servicesData.forEach((service) => {
        if (service.thumbNail?.systemName) {
          // Fire and forget - don't await
          getImageUri(service.thumbNail.systemName);
        }
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getImageUri]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await api.get<Service[]>('/en/on/services', {
        requiresAuth: true,
      });

      const servicesData = response.data || [];
      setServices(servicesData);
      setFilteredServices(servicesData);

      // Pre-fetch images asynchronously (non-blocking)
      servicesData.forEach((service) => {
        if (service.thumbNail?.systemName) {
          getImageUri(service.thumbNail.systemName);
        }
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh services. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [getImageUri]);

  const handleViewService = useCallback((service: Service) => {
    // Navigate to service details
    router.push(`/ServiceDetails?serviceId=${service.id}`);
  }, []);

  const handleDeleteService = useCallback((service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Make DELETE request
              // await api.delete(`/en/on/services/${service.id}`, { requiresAuth: true });
              // Refresh services list
              await fetchServices();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete service. Please try again.');
            }
          },
        },
      ]
    );
  }, [fetchServices]);

  const handleAddService = useCallback(() => {
    // Navigate to add service page
    router.push('/NewService');
  }, []);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={fetchServices}
            activeOpacity={0.7}
          >
            <Ionicons name="reload-outline" size={24} color={colors.primary.green} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddService}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={colors.primary.green} />
          </TouchableOpacity>
        </View>
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
            placeholder="Search services..."
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

      {/* Loading State */}
      {isLoading && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.servicesList}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.serviceCard}>
                {/* Service Thumbnail Skeleton */}
                <Skeleton
                  width={80}
                  height={80}
                  borderRadius={12}
                  style={styles.serviceImageSkeleton}
                />

                {/* Service Content Skeleton */}
                <View style={styles.serviceContent}>
                  <View style={styles.serviceHeader}>
                    <Skeleton width="70%" height={20} borderRadius={8} />
                    <Skeleton width={50} height={20} borderRadius={6} style={{ marginLeft: 8 }} />
                  </View>

                  <Skeleton width="100%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                  <Skeleton width="85%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />

                  <View style={styles.serviceFooter}>
                    <Skeleton width={80} height={14} borderRadius={6} />
                  </View>
                </View>

                {/* Action Buttons Skeleton */}
                <View style={styles.actionButtons}>
                  <Skeleton width={36} height={36} borderRadius={8} style={{ marginBottom: 8 }} />
                  <Skeleton width={36} height={36} borderRadius={8} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchServices}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Services List */}
      {!isLoading && !error && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary.green]}
              tintColor={colors.primary.green}
            />
          }
        >
          {filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="grid-outline" size={64} color={colors.neutral.gray.light} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No services found' : 'No services available'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Add a new service to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {filteredServices.map((service) => {
                const systemName = service.thumbNail?.systemName;
                const imageUri = systemName ? imageUris[systemName] : null;
                const isLoadingImage = systemName ? loadingImages.has(systemName) : false;
                const isFailedImage = systemName ? failedImages.has(systemName) : false;

                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    imageUri={imageUri}
                    isLoadingImage={isLoadingImage}
                    isFailedImage={isFailedImage}
                    onLoadImage={systemName ? () => getImageUri(systemName) : undefined}
                    onView={handleViewService}
                    onDelete={handleDeleteService}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </>
  );
};

export default Services;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
    addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    textAlign: 'center',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    padding: 16,
    marginBottom: 12,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  serviceImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: colors.neutral.gray.lightest,
  },
  serviceImageSkeleton: {
    marginRight: 12,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary.greenLight + '20',
  },
  serviceContent: {
    flex: 1,
    marginRight: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  privateBadge: {
    backgroundColor: colors.neutral.gray.lighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  privateBadgeText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.dark,
  },
  publicBadge: {
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publicBadgeText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeText: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
  },
  viewButton: {
    width: 36,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
});
