import Skeleton from '@/components/Skeleton';
import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

interface ServiceMode {
  id: number;
  name: string;
  isActive: boolean;
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

interface BranchService {
  id: string;
  organizationId: string;
  branchId: string;
  serviceId: string;
  isDeleted: boolean;
  service: Service;
  createdAt: number;
  updatedAt: number;
}

interface BranchServicesTabProps {
  branchId: string;
}

const BranchServicesTab: React.FC<BranchServicesTabProps> = ({ branchId }) => {
  const [services, setServices] = useState<BranchService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoadingAllServices, setIsLoadingAllServices] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [isAddingServices, setIsAddingServices] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<BranchService[]>(
        `/en/on/branch/${branchId}/services`,
        {
          requiresAuth: true,
        }
      );

      setServices(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleViewService = (serviceId: string) => {
    router.push({
      pathname: '/ServiceDetailsSummary',
      params: { serviceId },
    });
  };

  const handleOpenAddModal = async () => {
    setIsAddModalVisible(true);
    setSelectedServiceIds(new Set());
    setSearchQuery('');
    await fetchAllServices();
  };

  const fetchAllServices = useCallback(async () => {
    setIsLoadingAllServices(true);
    try {
      const response = await api.get<Service[]>('/en/on/services', {
        requiresAuth: true,
      });

      const allServicesData = response.data || [];
      // Filter out services that are already assigned to this branch
      const assignedServiceIds = new Set(services.map((bs) => bs.serviceId));
      const availableServices = allServicesData.filter(
        (service) => !assignedServiceIds.has(service.id) && !service.isDeleted
      );
      setAllServices(availableServices);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load services. Please try again.', 'error');
    } finally {
      setIsLoadingAllServices(false);
    }
  }, [services]);

  const handleToggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleAddServices = async () => {
    if (selectedServiceIds.size === 0) {
      showToast('Please select at least one service', 'error');
      return;
    }

    setIsAddingServices(true);
    try {
      const response = await api.post<{ success: boolean }>(
        '/en/on/add/service/branch',
        {
          branchId,
          serviceId: Array.from(selectedServiceIds),
        },
        {
          requiresAuth: true,
        }
      );

      if (response.status === 200 || response.status === 201) {
        showToast('Services added successfully', 'success');
        setIsAddModalVisible(false);
        setSelectedServiceIds(new Set());
        await fetchServices(); // Refresh the list
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to add services. Please try again.', 'error');
    } finally {
      setIsAddingServices(false);
    }
  };

  const handleRemoveService = (serviceBranchId: string, serviceName: string) => {
    Alert.alert(
      'Remove Service',
      `Are you sure you want to remove "${serviceName}" from this branch?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(
                `/en/on/remove/service/branch/${serviceBranchId}`,
                {
                  requiresAuth: true,
                }
              );

              // Handle 204 status code as success
              if (response.status === 204 || response.status === 200) {
                showToast(`${serviceName} removed successfully`, 'success');
                await fetchServices(); // Refresh the list
              }
            } catch (err: any) {
              // Also check if status is 204 in error response
              if (err?.response?.status === 204) {
                showToast(`${serviceName} removed successfully`, 'success');
                await fetchServices(); // Refresh the list
              } else {
                showToast(err?.message || 'Failed to remove service. Please try again.', 'error');
              }
            }
          },
        },
      ]
    );
  };

  const filteredAllServices = allServices.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.serviceCard}>
            <Skeleton width="100%" height={80} borderRadius={12} />
          </View>
        ))}
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchServices}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Branch Services</Text>
        <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={fetchServices}
          activeOpacity={0.7}
        >
          <Ionicons name="reload-outline" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenAddModal}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        </View>
      </View>

      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="grid-outline" size={64} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>No services available</Text>
          <Text style={styles.emptySubtext}>
            This branch doesn't have any services yet
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {services.map((branchService) => (
            <View key={branchService.id} style={styles.serviceCard}>
              <TouchableOpacity
                style={styles.serviceContentTouchable}
                onPress={() => handleViewService(branchService.service.id)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceContent}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {branchService.service.name}
                    </Text>
                    {!branchService.service.isPublic && (
                      <View style={styles.privateBadge}>
                        <Ionicons name="lock-closed" size={12} color={colors.neutral.gray.dark} />
                        <Text style={styles.privateBadgeText}>Private</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {branchService.service.description}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.neutral.gray.medium}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveService(branchService.id, branchService.service.name)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={colors.semantic.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Services Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Services to Branch</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
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
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.neutral.gray.medium}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Services List */}
            {isLoadingAllServices ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.green} />
                <Text style={styles.modalLoadingText}>Loading services...</Text>
              </View>
            ) : filteredAllServices.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Ionicons name="grid-outline" size={48} color={colors.neutral.gray.light} />
                <Text style={styles.modalEmptyText}>
                  {searchQuery ? 'No services found' : 'No available services'}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                {filteredAllServices.map((service) => {
                  const isSelected = selectedServiceIds.has(service.id);
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.serviceSelectCard}
                      onPress={() => handleToggleServiceSelection(service.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.serviceSelectCheckbox,
                          isSelected && styles.serviceSelectCheckboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
                        )}
                      </View>
                    <View style={styles.serviceSelectContent}>
                      <View style={styles.serviceSelectHeader}>
                        <Text style={styles.serviceSelectName} numberOfLines={1}>
                          {service.name}
                        </Text>
                        {service.mode && (
                          <View style={styles.modeBadge}>
                            <Text style={styles.modeBadgeText}>{service.mode.name}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.serviceSelectDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsAddModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalAddButton,
                  (selectedServiceIds.size === 0 || isAddingServices) && styles.modalAddButtonDisabled,
                ]}
                onPress={handleAddServices}
                disabled={selectedServiceIds.size === 0 || isAddingServices}
                activeOpacity={0.7}
              >
                {isAddingServices ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={styles.modalAddButtonText}>
                    Add ({selectedServiceIds.size})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default BranchServicesTab;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    gap: 12,
  },
  serviceContentTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceContent: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.gray.lighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  privateBadgeText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.dark,
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    lineHeight: 20,
  },
  removeButton: {
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
    marginTop: 16,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: colors.background.secondary,
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
  modalScrollView: {
    maxHeight: 400,
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    textAlign: 'center',
  },
  serviceSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    gap: 12,
  },
  serviceSelectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary.green,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceSelectCheckboxSelected: {
    backgroundColor: colors.primary.green,
    borderColor: colors.primary.green,
  },
  serviceSelectContent: {
    flex: 1,
  },
  serviceSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  serviceSelectName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  modeBadge: {
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  serviceSelectDescription: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.neutral.gray.lighter,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary.green,
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    backgroundColor: colors.neutral.gray.light,
    opacity: 0.6,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
});

