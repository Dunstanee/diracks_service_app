import Skeleton from '@/components/Skeleton';
import Toast, { ToastType } from '@/components/Toast';
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
    Alert,
    ImageBackground,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

const ServiceDetails = () => {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [isVisibilityModalVisible, setIsVisibilityModalVisible] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [isLoadingPricings, setIsLoadingPricings] = useState(false);
  const [isPricingModalVisible, setIsPricingModalVisible] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [pricingForm, setPricingForm] = useState({
    name: '',
    description: '',
    amount: '',
    discount: '',
  });
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

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

  const handleEdit = () => {
    router.push(`/EditService?serviceId=${serviceId}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service?.name}"? This action cannot be undone.`,
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
              // TODO: Implement delete API call
              // await api.delete(`/en/on/service/${serviceId}`, { requiresAuth: true });
              showToast('Service deleted successfully', 'success');
              setTimeout(() => router.back(), 1000);
            } catch (err: any) {
              showToast('Failed to delete service. Please try again.', 'error');
            }
          },
        },
      ]
    );
  };

  const handleAddTag = () => {
    setEditingTag(null);
    setTagInput('');
    setIsTagModalVisible(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagInput(tag.name);
    setIsTagModalVisible(true);
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete the tag "${tag.name}"?`,
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
              const response = await api.delete(`/en/on/service/tag/${tag.id}`, {
                requiresAuth: true,
              });
              
              // Handle 204 status code as success
              if (response.status === 204 || response.status === 200) {
                await fetchTags();
                showToast('Tag deleted successfully', 'success');
              }
            } catch (err: any) {
              console.log(err);
              // Also check if status is 204 in error response
              if (err?.response?.status === 204) {
                await fetchTags();
                showToast('Tag deleted successfully', 'success');
              } else {
                showToast(err?.message || 'Failed to delete tag. Please try again.', 'error');
              }
            }
          },
        },
      ]
    );
  };

  const handleSaveTag = async () => {
    if (!serviceId || !tagInput.trim()) {
      showToast('Please enter a tag name', 'error');
      return;
    }

    setIsSavingTag(true);
    try {
      if (editingTag) {
        // Update existing tag
        await api.patch(
          `/en/on/service/tag/${editingTag.id}`,
          { tag: tagInput.trim() },
          { requiresAuth: true }
        );
        showToast('Tag updated successfully', 'success');
      } else {
        // Add new tags - split by comma and trim
        const tagNames = tagInput
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        if (tagNames.length === 0) {
          showToast('Please enter at least one tag', 'error');
          setIsSavingTag(false);
          return;
        }

        await api.post(
          '/en/on/service/tags',
          {
            serviceId: serviceId,
            tags: tagNames,
          },
          { requiresAuth: true }
        );
        showToast('Tags added successfully', 'success');
      }

      setIsTagModalVisible(false);
      setTagInput('');
      setEditingTag(null);
      await fetchTags();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save tag. Please try again.', 'error');
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleAddPricing = () => {
    setEditingPricing(null);
    setPricingForm({
      name: '',
      description: '',
      amount: '',
      discount: '',
    });
    setIsPricingModalVisible(true);
  };

  const handleEditPricing = (pricing: Pricing) => {
    setEditingPricing(pricing);
    setPricingForm({
      name: pricing.name,
      description: pricing.description,
      amount: pricing.amount.toString(),
      discount: pricing.discount.toString(),
    });
    setIsPricingModalVisible(true);
  };

  const handleDeletePricing = (pricing: Pricing) => {
    Alert.alert(
      'Delete Pricing',
      `Are you sure you want to delete the pricing "${pricing.name}"?`,
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
              const response = await api.delete(
                `/en/on/service/${serviceId}/pricing/${pricing.id}`,
                {
                  requiresAuth: true,
                }
              );
              // Handle 204 status code as success
              if (response.status === 204 || response.status === 200) {
                await fetchPricings();
                showToast('Pricing deleted successfully', 'success');
              }
            } catch (err: any) {
              // Also check if status is 204 in error response
              if (err?.response?.status === 204) {
                await fetchPricings();
                showToast('Pricing deleted successfully', 'success');
              } else {
                showToast(err?.message || 'Failed to delete pricing. Please try again.', 'error');
              }
            }
          },
        },
      ]
    );
  };

  const handleSavePricing = async () => {
    if (!serviceId) return;

    // Validation
    if (!pricingForm.name.trim()) {
      showToast('Please enter a pricing name', 'error');
      return;
    }
    if (!pricingForm.amount.trim() || isNaN(Number(pricingForm.amount)) || Number(pricingForm.amount) < 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (pricingForm.discount.trim() && (isNaN(Number(pricingForm.discount)) || Number(pricingForm.discount) < 0)) {
      showToast('Please enter a valid discount', 'error');
      return;
    }

    setIsSavingPricing(true);
    try {
      const payload = {
        name: pricingForm.name.trim(),
        description: pricingForm.description.trim(),
        amount: Number(pricingForm.amount),
        discount: pricingForm.discount.trim() ? Number(pricingForm.discount) : 0,
      };

      if (editingPricing) {
        // Update existing pricing
        await api.patch(
          `/en/on/service/${serviceId}/pricing/${editingPricing.id}`,
          payload,
          { requiresAuth: true }
        );
        showToast('Pricing updated successfully', 'success');
      } else {
        // Create new pricing
        await api.post(
          `/en/on/create/service/${serviceId}/pricing`,
          payload,
          { requiresAuth: true }
        );
        showToast('Pricing added successfully', 'success');
      }

      setIsPricingModalVisible(false);
      setPricingForm({
        name: '',
        description: '',
        amount: '',
        discount: '',
      });
      setEditingPricing(null);
      await fetchPricings();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save pricing. Please try again.', 'error');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleToggleVisibility = async (newIsPublic: boolean) => {
    if (!serviceId || !service) return;

    setIsUpdatingVisibility(true);
    try {
      await api.post(
        '/en/on/service/state',
        {
          isPublic: newIsPublic,
          serviceId: serviceId,
        },
        {
          requiresAuth: true,
        }
      );

      // Update the service state locally
      setService((prev) => {
        if (!prev) return prev;
        return { ...prev, isPublic: newIsPublic };
      });

      setIsVisibilityModalVisible(false);
      showToast(`Service is now ${newIsPublic ? 'public' : 'private'}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update service visibility. Please try again.', 'error');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={hideToast}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Skeleton */}
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary.green} />
            <Text style={styles.processingText}>Processing Please Wait...</Text>
          </View>

          {/* Banner Skeleton */}
          <Skeleton width="100%" height={200} borderRadius={0} style={styles.bannerSkeleton} />

          {/* Content Skeleton */}
          <View style={styles.contentSkeleton}>
            <Skeleton width="80%" height={28} borderRadius={8} style={styles.titleSkeleton} />
            <Skeleton width="100%" height={16} borderRadius={6} style={styles.textSkeleton} />
            <Skeleton width="90%" height={16} borderRadius={6} style={styles.textSkeleton} />
            <Skeleton width="60%" height={16} borderRadius={6} style={styles.textSkeleton} />
          </View>
        </ScrollView>
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={hideToast}
        />
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
      </>
    );
  }

  const defaultBanner = require('@/assets/backgroud/default-banner.png');

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
      {/* Header */}
      <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={24} color={colors.text.inverse} />
            </TouchableOpacity>

          </View>
        </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        

        {/* Banner */}
        <View style={styles.bannerContainer}>
          {isLoadingBanner ? (
            <Skeleton width="100%" height={200} borderRadius={0} />
          ) : bannerUri ? (
            <ImageBackground
              source={{ uri: bannerUri }}
              style={styles.banner}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.bannerGradient}
              />
            </ImageBackground>
          ) : (
            <ImageBackground
              source={defaultBanner}
              style={styles.banner}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.bannerGradient}
              />
            </ImageBackground>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Service Name and Status */}
          <View style={styles.titleSection}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <TouchableOpacity
              style={[
                styles.visibilityBadge,
                service.isPublic ? styles.publicBadge : styles.privateBadge
              ]}
              onPress={() => setIsVisibilityModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={service.isPublic ? "globe-outline" : "lock-closed"}
                size={12}
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
              <Ionicons
                name="chevron-down"
                size={12}
                color={service.isPublic ? colors.primary.green : colors.neutral.gray.dark}
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          {/* Service Mode */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Mode</Text>
            <View style={styles.modeContainer}>
              <Ionicons name="folder-outline" size={20} color={colors.primary.green} />
              <Text style={styles.modeText}>{service.mode.name}</Text>
            </View>
          </View>

          {/* Staff Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Created By</Text>
            <View style={styles.staffContainer}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffInitials}>
                  {service.staff.firstName.charAt(0)}
                  {service.staff.lastName.charAt(0)}
                </Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>
                  {service.staff.firstName} {service.staff.lastName}
                </Text>
                <Text style={styles.staffEmail}>{service.staff.email}</Text>
              </View>
            </View>
          </View>

          {/* Service Tags */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.sectionHeaderActions}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={fetchTags}
                  activeOpacity={0.7}
                >
                  <Ionicons name="reload-outline" size={24} color={colors.primary.green} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddTag}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary.green} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.tagsContainer}>
              {isLoadingTags ? (
                <ActivityIndicator size="small" color={colors.primary.green} />
              ) : tags.length === 0 ? (
                <Text style={styles.emptyTagsText}>No tags added yet</Text>
              ) : (
                tags.map((tag) => (
                  <View key={tag.id} style={styles.tagItem}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                    <View style={styles.tagActions}>
                      <TouchableOpacity
                        style={styles.tagActionButton}
                        onPress={() => handleEditTag(tag)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={16} color={colors.primary.green} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.tagActionButton}
                        onPress={() => handleDeleteTag(tag)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.semantic.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              <View style={styles.sectionHeaderActions}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={fetchPricings}
                  activeOpacity={0.7}
                >
                  <Ionicons name="reload-outline" size={24} color={colors.primary.green} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddPricing}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary.green} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.pricingContainer}>
              {isLoadingPricings ? (
                <ActivityIndicator size="small" color={colors.primary.green} />
              ) : pricings.length === 0 ? (
                <Text style={styles.emptyPricingText}>No pricing items added yet</Text>
              ) : (
                pricings.map((pricing) => (
                  <View key={pricing.id} style={styles.pricingItem}>
                    <View style={styles.pricingContent}>
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

                      {pricing.discount > 0 ? (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>
                            ${pricing.discount.toFixed(2)} discount
                          </Text>
                        </View>
                      ) : (
                        <View />
                      )}
                      <View style={styles.pricingActions}>
                        <TouchableOpacity
                          style={styles.pricingUpdateButton}
                          onPress={() => handleEditPricing(pricing)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="create-outline" size={16} color={colors.text.inverse} />
                          <Text style={styles.pricingUpdateButtonText}>Update</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.pricingDeleteButton}
                          onPress={() => handleDeletePricing(pricing)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.text.inverse} />
                          <Text style={styles.pricingDeleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>

                    </View>

                  </View>
                ))
              )}
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.metadataSection}>
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
          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
            disabled={true}
          >
            <Ionicons name="trash-outline" size={24} color={colors.text.inverse} />
            <Text style={styles.deleteButtonText}>Delete Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Visibility Toggle Modal */}
      <Modal
        visible={isVisibilityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisibilityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Service Visibility</Text>
            <Text style={styles.modalDescription}>
              Choose whether this service should be public or private.
            </Text>

            <View style={styles.visibilityOptions}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  service?.isPublic && styles.visibilityOptionActive
                ]}
                onPress={() => handleToggleVisibility(true)}
                disabled={isUpdatingVisibility || service?.isPublic}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="globe"
                  size={24}
                  color={service?.isPublic ? colors.text.inverse : colors.primary.green}
                />
                <View style={styles.visibilityOptionContent}>
                  <Text
                    style={[
                      styles.visibilityOptionTitle,
                      service?.isPublic && styles.visibilityOptionTitleActive
                    ]}
                  >
                    Public
                  </Text>
                  <Text
                    style={[
                      styles.visibilityOptionDescription,
                      service?.isPublic && styles.visibilityOptionDescriptionActive
                    ]}
                  >
                    Visible to everyone
                  </Text>
                </View>
                {service?.isPublic && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.text.inverse}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  !service?.isPublic && styles.visibilityOptionActive
                ]}
                onPress={() => handleToggleVisibility(false)}
                disabled={isUpdatingVisibility || !service?.isPublic}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="lock-closed"
                  size={24}
                  color={!service?.isPublic ? colors.text.inverse : colors.neutral.gray.dark}
                />
                <View style={styles.visibilityOptionContent}>
                  <Text
                    style={[
                      styles.visibilityOptionTitle,
                      !service?.isPublic && styles.visibilityOptionTitleActive
                    ]}
                  >
                    Private
                  </Text>
                  <Text
                    style={[
                      styles.visibilityOptionDescription,
                      !service?.isPublic && styles.visibilityOptionDescriptionActive
                    ]}
                  >
                    Only visible to you
                  </Text>
                </View>
                {!service?.isPublic && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.text.inverse}
                  />
                )}
              </TouchableOpacity>
            </View>

            {isUpdatingVisibility && (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={colors.primary.green} />
                <Text style={styles.modalLoadingText}>Updating...</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsVisibilityModalVisible(false)}
              disabled={isUpdatingVisibility}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tag Management Modal */}
      <Modal
        visible={isTagModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsTagModalVisible(false);
          setTagInput('');
          setEditingTag(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTag ? 'Edit Tag' : 'Add Tags'}
            </Text>
            <Text style={styles.modalDescription}>
              {editingTag
                ? 'Update the tag name below.'
                : 'Enter tag names separated by commas (e.g., mechanical, usv cars, brigg)'}
            </Text>

            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Enter tag name(s)"
                placeholderTextColor={colors.neutral.gray.medium}
                value={tagInput}
                onChangeText={setTagInput}
                autoCapitalize="none"
                autoCorrect={false}
                multiline={false}
              />
            </View>

            {isSavingTag && (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={colors.primary.green} />
                <Text style={styles.modalLoadingText}>Saving...</Text>
              </View>
            )}

            <View style={styles.tagModalButtons}>
              <TouchableOpacity
                style={[styles.tagModalButton, styles.tagModalCancelButton]}
                onPress={() => {
                  setIsTagModalVisible(false);
                  setTagInput('');
                  setEditingTag(null);
                }}
                disabled={isSavingTag}
                activeOpacity={0.7}
              >
                <Text style={styles.tagModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tagModalButton, styles.tagModalSaveButton]}
                onPress={handleSaveTag}
                disabled={isSavingTag || !tagInput.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.tagModalSaveButtonText}>
                  {editingTag ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pricing Management Modal */}
      <Modal
        visible={isPricingModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsPricingModalVisible(false);
          setPricingForm({
            name: '',
            description: '',
            amount: '',
            discount: '',
          });
          setEditingPricing(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPricing ? 'Edit Pricing' : 'Add Pricing'}
            </Text>
            <Text style={styles.modalDescription}>
              {editingPricing
                ? 'Update the pricing details below.'
                : 'Enter the pricing details for this service.'}
            </Text>

            <View style={styles.pricingFormContainer}>
              <View style={styles.pricingFormField}>
                <Text style={styles.pricingFormLabel}>Name *</Text>
                <TextInput
                  style={styles.pricingFormInput}
                  placeholder="e.g., General Service"
                  placeholderTextColor={colors.neutral.gray.medium}
                  value={pricingForm.name}
                  onChangeText={(text) => setPricingForm((prev) => ({ ...prev, name: text }))}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.pricingFormField}>
                <Text style={styles.pricingFormLabel}>Description</Text>
                <TextInput
                  style={[styles.pricingFormInput, styles.pricingFormTextArea]}
                  placeholder="Enter description"
                  placeholderTextColor={colors.neutral.gray.medium}
                  value={pricingForm.description}
                  onChangeText={(text) => setPricingForm((prev) => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.pricingFormRow}>
                <View style={[styles.pricingFormField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.pricingFormLabel}>Amount *</Text>
                  <View style={styles.pricingFormInputWithPrefix}>
                    <Text style={styles.pricingFormPrefix}>$</Text>
                    <TextInput
                      style={[styles.pricingFormInput, styles.pricingFormInputNoBorder]}
                      placeholder="0.00"
                      placeholderTextColor={colors.neutral.gray.medium}
                      value={pricingForm.amount}
                      onChangeText={(text) => setPricingForm((prev) => ({ ...prev, amount: text }))}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={[styles.pricingFormField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.pricingFormLabel}>Discount</Text>
                  <View style={styles.pricingFormInputWithPrefix}>
                    <Text style={styles.pricingFormPrefix}>$</Text>
                    <TextInput
                      style={[styles.pricingFormInput, styles.pricingFormInputNoBorder]}
                      placeholder="0.00"
                      placeholderTextColor={colors.neutral.gray.medium}
                      value={pricingForm.discount}
                      onChangeText={(text) => setPricingForm((prev) => ({ ...prev, discount: text }))}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>

              {pricingForm.amount && !isNaN(Number(pricingForm.amount)) && (
                <View style={styles.pricingSummary}>
                  <Text style={styles.pricingSummaryLabel}>Total Amount:</Text>
                  <Text style={styles.pricingSummaryAmount}>
                    ${(Number(pricingForm.amount) - (Number(pricingForm.discount) || 0)).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {isSavingPricing && (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={colors.primary.green} />
                <Text style={styles.modalLoadingText}>Saving...</Text>
              </View>
            )}

            <View style={styles.tagModalButtons}>
              <TouchableOpacity
                style={[styles.tagModalButton, styles.tagModalCancelButton]}
                onPress={() => {
                  setIsPricingModalVisible(false);
                  setPricingForm({
                    name: '',
                    description: '',
                    amount: '',
                    discount: '',
                  });
                  setEditingPricing(null);
                }}
                disabled={isSavingPricing}
                activeOpacity={0.7}
              >
                <Text style={styles.tagModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tagModalButton, styles.tagModalSaveButton]}
                onPress={handleSavePricing}
                disabled={isSavingPricing}
                activeOpacity={0.7}
              >
                <Text style={styles.tagModalSaveButtonText}>
                  {editingPricing ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ServiceDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.primary.green,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    fontFamily: fonts.weights.regular,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: colors.semantic.error,
    padding: 12,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
  },
  // Banner
  bannerContainer: {
    width: '100%',
    height: 200,
  },
  banner: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  // Content
  content: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  serviceName: {
    fontSize: 28,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    lineHeight: 24,
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modeText: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.primary.green,
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
    gap: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  tagText: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
    flex: 1,
  },
  tagActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tagActionButton: {
    padding: 4,
  },
  emptyTagsText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    fontStyle: 'italic',
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
  pricingContent: {
    flex: 1,
    marginRight: 12,
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
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 12,
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
