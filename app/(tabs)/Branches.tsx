import Input from '@/components/Input';
import LocationPicker, { LocationData } from '@/components/LocationPicker';
import Select from '@/components/Select';
import Skeleton from '@/components/Skeleton';
import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { formatDateCustom } from '@/utils/date';
import { branchSchema, validateForm } from '@/validators';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Branch {
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
}

interface Country {
  id: string;
  name: string;
  short: string;
  formats: string[];
}

const Branches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    city: '',
    stateProvince: '',
    description: '',
    location: null as LocationData | null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Filter branches based on search query
    if (searchQuery.trim() === '') {
      setFilteredBranches(branches);
    } else {
      const filtered = branches.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBranches(filtered);
    }
  }, [searchQuery, branches]);

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Branch[]>('/en/on/branches', {
        requiresAuth: true,
      });

      const branchesData = response.data || [];
      setBranches(branchesData);
      setFilteredBranches(branchesData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load branches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await api.get<Branch[]>('/en/on/branches', {
        requiresAuth: true,
      });

      const branchesData = response.data || [];
      setBranches(branchesData);
      setFilteredBranches(branchesData);
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh branches. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const fetchCountries = useCallback(async () => {
    setIsLoadingCountries(true);
    try {
      const response = await api.get<Country[]>('/countries', {
        requiresAuth: false,
      });
      setCountries(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch countries:', err);
      setCountries([]);
    } finally {
      setIsLoadingCountries(false);
    }
  }, []);

  useEffect(() => {
    if (isAddModalVisible) {
      fetchCountries();
    }
  }, [isAddModalVisible, fetchCountries]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleOpenAddModal = () => {
    setIsAddModalVisible(true);
    setFormData({
      name: '',
      contact: '',
      email: '',
      city: '',
      stateProvince: '',
      description: '',
      location: null,
    });
    setFormErrors({});
  };

  const handleCloseAddModal = () => {
    setIsAddModalVisible(false);
    setFormData({
      name: '',
      contact: '',
      email: '',
      city: '',
      stateProvince: '',
      description: '',
      location: null,
    });
    setFormErrors({});
  };

  const handleCreateBranch = async () => {
    if (!formData.location) {
      setFormErrors({ location: 'Location is required' });
      return;
    }

    // Extract phone number digits only (remove +, spaces, and other non-digits)
    // Remove plus sign first, then remove all non-digit characters
    const phoneDigits = formData.contact.replace(/\+/g, '').replace(/\D/g, '');
    const contactNumber = parseInt(phoneDigits, 10);

    const validation = validateForm(branchSchema, {
      name: formData.name,
      contact: formData.contact,
      email: formData.email,
      city: formData.city,
      stateProvince: formData.stateProvince,
      description: formData.description || null,
      location: formData.location.location,
      latitude: formData.location.latitude,
      longitude: formData.location.longitude,
      accuracy: formData.location.accuracy,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: formData.name.trim(),
        contact: contactNumber,
        email: formData.email.trim(),
        city: formData.city.trim(),
        stateProvince: formData.stateProvince,
        description: formData.description?.trim() || '',
        location: formData.location.location,
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        accuracy: formData.location.accuracy,
      };

      await api.post('/en/on/branch', payload, {
        requiresAuth: true,
      });

      showToast('Branch created successfully', 'success');
      handleCloseAddModal();
      await fetchBranches();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create branch. Please try again.';
      showToast(errorMessage, 'error');
      if (err?.data?.errors) {
        setFormErrors(err.data.errors);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddBranch = useCallback(() => {
    handleOpenAddModal();
  }, []);

  const handleViewBranch = useCallback((branch: Branch) => {
    router.push({
      pathname: '/BranchDetails',
      params: { branchId: branch.id },
    });
  }, []);

  const getBranchInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return 'B';
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };


  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Branches</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddBranch}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
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
            placeholder="Search branches..."
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
          <View style={styles.branchesList}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.branchCard}>
                <Skeleton width={56} height={56} borderRadius={28} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="60%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
                  <Skeleton width="80%" height={14} borderRadius={6} style={{ marginBottom: 4 }} />
                  <Skeleton width="60%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height={12} borderRadius={6} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTextMain}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchBranches}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Branches List */}
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
          {filteredBranches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color={colors.neutral.gray.light} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No branches found' : 'No branches available'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Add a new branch to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.branchesList}>
              {filteredBranches.map((branch) => (
                <TouchableOpacity
                  key={branch.id}
                  style={styles.branchCard}
                  onPress={() => handleViewBranch(branch)}
                  activeOpacity={0.7}
                >
                  <View style={styles.branchAvatarContainer}>
                    <Text style={styles.branchAvatarText}>
                      {getBranchInitials(branch.name)}
                    </Text>
                  </View>
                  <View style={styles.branchContent}>
                    <View style={styles.branchHeader}>
                      <View style={styles.branchTitleContainer}>
                        <Text style={styles.branchName} numberOfLines={1}>
                          {branch.name}
                        </Text>
                        {branch.isMain && (
                          <View style={styles.mainBadge}>
                            <Ionicons name="star" size={10} color={colors.secondary.orange} />
                            <Text style={styles.mainBadgeText}>Main</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.branchDetails}>
                      <Text style={styles.branchLocation} numberOfLines={1}>
                        {branch.city}, {branch.stateProvince}
                      </Text>
                    </View>
                    <Text style={styles.branchDate}>
                      created on {formatDateCustom(branch.createdAt, 'MM/DD/YYYY', 'en-US')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Branch Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAddModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Branch</Text>
                <TouchableOpacity
                  onPress={handleCloseAddModal}
                  style={styles.modalCloseButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Modal Form */}
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
              >
                <Input
                  label="Branch Name *"
                  placeholder="Enter branch name"
                  value={formData.name}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                  autoCapitalize="words"
                  error={formErrors.name}
                />

                <Input
                  label="Contact Number *"
                  placeholder="Enter phone number"
                  value={formData.contact}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, contact: text }))}
                  keyboardType="phone-pad"
                  error={formErrors.contact}
                />

                <Input
                  label="Email *"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={formErrors.email}
                />

                <Input
                  label="City *"
                  placeholder="Enter city"
                  value={formData.city}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, city: text }))}
                  autoCapitalize="words"
                  error={formErrors.city}
                />

                <Select
                  label="Country *"
                  options={countries.map((country) => ({
                    label: country.name,
                    value: country.name,
                  }))}
                  value={formData.stateProvince}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, stateProvince: value as string }))}
                  placeholder="Select country"
                  error={formErrors.stateProvince}
                />

                <Input
                  label="Description"
                  placeholder="Enter description (optional)"
                  value={formData.description}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={3}
                  error={formErrors.description}
                />

                <LocationPicker
                  label="Location *"
                  value={formData.location}
                  onChange={(location) => setFormData((prev) => ({ ...prev, location }))}
                  error={formErrors.location}
                />

                <TouchableOpacity
                  style={[
                    styles.createButton,
                    (isCreating || !formData.location) && styles.createButtonDisabled,
                  ]}
                  onPress={handleCreateBranch}
                  disabled={isCreating || !formData.location}
                  activeOpacity={0.7}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.createButtonText}>Create Branch</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
    </>
  );
};

export default Branches;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: colors.background.primary,
  },
  branchesList: {
    gap: 12,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    gap: 16,
  },
  branchAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.greenLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  branchAvatarText: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
  },
  branchContent: {
    flex: 1,
  },
  branchHeader: {
    marginBottom: 8,
  },
  branchTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  branchName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.orangeLight + '20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },
  mainBadgeText: {
    fontSize: 9,
    fontFamily: fonts.weights.semiBold,
    color: colors.secondary.orange,
  },
  branchDetails: {
    marginBottom: 8,
    gap: 4,
  },
  branchLocation: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  branchDate: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  errorTextMain: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
    backgroundColor: colors.background.primary,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.green,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
});
