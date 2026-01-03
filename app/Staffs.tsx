import DateTimePicker from '@/components/DateTimePicker';
import Input from '@/components/Input';
import Skeleton from '@/components/Skeleton';
import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { staffSchema, validateForm } from '@/validators';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  View,
} from 'react-native';

interface Staff {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: number;
  country: string | null;
  userNumber: string;
  gender: number; // 1 = male, 2 = female, 3 = transgender
  birthDate: string;
  verified: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

interface OrganizationStaff {
  id: string;
  organizationId: string;
  userId: string;
  staff: Staff;
  createdAt: number;
  updatedAt: number;
}

const Staffs = () => {
  const [staffs, setStaffs] = useState<OrganizationStaff[]>([]);
  const [filteredStaffs, setFilteredStaffs] = useState<OrganizationStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: null as Date | null,
    gender: 1 as 1 | 2,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const formatDateForAPI = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Check if form is valid using Zod
  const isFormValid = useMemo(() => {
    const validation = validateForm(staffSchema, {
      firstName: formData.firstName,
      middleName: formData.middleName || null,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate ? formatDateForAPI(formData.birthDate) : '',
      gender: String(formData.gender),
    });
    return validation.isValid;
  }, [formData, formatDateForAPI]);

  useEffect(() => {
    // Filter staffs based on search query
    if (searchQuery.trim() === '') {
      setFilteredStaffs(staffs);
    } else {
      const filtered = staffs.filter(
        (orgStaff) => {
          const staff = orgStaff.staff;
          const searchLower = searchQuery.toLowerCase();
          return (
            staff.firstName.toLowerCase().includes(searchLower) ||
            staff.lastName.toLowerCase().includes(searchLower) ||
            staff.email.toLowerCase().includes(searchLower) ||
            staff.userNumber.toLowerCase().includes(searchLower) ||
            staff.phone.toString().includes(searchQuery)
          );
        }
      );
      setFilteredStaffs(filtered);
    }
  }, [searchQuery, staffs]);

  const fetchStaffs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<OrganizationStaff[]>('/en/on/staffs', {
        requiresAuth: true,
      });

      const staffsData = response.data || [];
      setStaffs(staffsData);
      setFilteredStaffs(staffsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load staffs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await api.get<OrganizationStaff[]>('/en/on/staffs', {
        requiresAuth: true,
      });

      const staffsData = response.data || [];
      setStaffs(staffsData);
      setFilteredStaffs(staffsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh staffs. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const getStaffInitials = (staff: Staff): string => {
    const firstName = staff.firstName || '';
    const lastName = staff.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'S';
  };

  const getStaffName = (staff: Staff): string => {
    return [staff.firstName, staff.middleName, staff.lastName]
      .filter(Boolean)
      .join(' ') || staff.email || 'Staff';
  };

  const getGenderLabel = (gender: number): string => {
    switch (gender) {
      case 1:
        return 'Male';
      case 2:
        return 'Female';
      case 3:
        return 'Transgender';
      default:
        return 'Unknown';
    }
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleOpenAddModal = () => {
    setIsAddModalVisible(true);
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: null,
      gender: 1,
    });
    setFormErrors({});
  };

  const handleCloseAddModal = () => {
    setIsAddModalVisible(false);
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: null,
      gender: 1,
    });
    setFormErrors({});
  };

  const handleCreateStaff = async () => {
    const validation = validateForm(staffSchema, {
      firstName: formData.firstName,
      middleName: formData.middleName || null,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate ? formatDateForAPI(formData.birthDate) : '',
      gender: String(formData.gender),
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: parseInt(formData.phone, 10),
        birthDate: formData.birthDate ? formatDateForAPI(formData.birthDate) : '',
        gender: formData.gender,
      };

      await api.post('/en/on/create/staff', payload, {
        requiresAuth: true,
      });

      showToast('Staff created successfully', 'success');
      handleCloseAddModal();
      await fetchStaffs(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create staff. Please try again.';
      showToast(errorMessage, 'error');
      if (err?.data?.errors) {
        setFormErrors(err.data.errors);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewStaff = useCallback((orgStaff: OrganizationStaff) => {
    router.push({
      pathname: '/ViewStaff',
      params: { organizationStaffId: orgStaff.id },
    });
  }, []);

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staffs</Text>
          <View style={styles.headerRight}>
            {/* <TouchableOpacity
              style={styles.iconButton}
              onPress={fetchStaffs}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={24} color={colors.primary.green} />
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleOpenAddModal}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={colors.text.inverse} />
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
              placeholder="Search staffs..."
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
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={styles.skeletonCard}>
                <View style={styles.skeletonHeader}>
                  <Skeleton width={56} height={56} circle />
                  <View style={styles.skeletonContent}>
                    <Skeleton width="60%" height={20} borderRadius={8} style={{ marginBottom: 8 }} />
                    <Skeleton width="80%" height={16} borderRadius={6} />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
            <Text style={styles.errorMessageText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStaffs} activeOpacity={0.7}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Staff List */}
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
            {filteredStaffs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={colors.neutral.gray.light} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No staff found' : 'No staff available'}
                </Text>
              </View>
            ) : (
              filteredStaffs.map((orgStaff) => {
                const staff = orgStaff.staff;
                return (
                  <TouchableOpacity
                    key={orgStaff.id}
                    style={styles.staffCard}
                    activeOpacity={0.7}
                    onPress={() => handleViewStaff(orgStaff)}
                  >
                    <View style={styles.staffCardContent}>
                      {/* Avatar Badge */}
                      <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{getStaffInitials(staff)}</Text>
                      </View>

                      {/* Staff Info */}
                      <View style={styles.staffInfo}>
                        <Text style={styles.staffName} numberOfLines={1}>
                          {getStaffName(staff)}
                        </Text>
                        <Text style={styles.staffEmail} numberOfLines={1}>
                          {staff.email}
                        </Text>
                        <View style={styles.staffDetails}>
                          <View style={styles.detailRow}>
                            <Ionicons name="call-outline" size={14} color={colors.neutral.gray.medium} />
                            <Text style={styles.detailText}>{staff.phone}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Ionicons name="person-outline" size={14} color={colors.neutral.gray.medium} />
                            <Text style={styles.detailText}>{getGenderLabel(staff.gender)}</Text>
                          </View>
                        </View>
                        <View style={styles.staffBadges}>
                          <View style={styles.userNumberBadge}>
                            <Text style={styles.userNumberText}>{staff.userNumber}</Text>
                          </View>
                          {staff.verified && (
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark-circle" size={14} color={colors.primary.green} />
                              <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                          )}
                          {!staff.active && (
                            <View style={styles.inactiveBadge}>
                              <Text style={styles.inactiveText}>Inactive</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Add Staff Modal */}
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
                <Text style={styles.modalTitle}>Add New Staff</Text>
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
              >
              <Input
                label="First Name *"
                placeholder="Enter first name"
                value={formData.firstName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, firstName: text }))}
                autoCapitalize="words"
                error={formErrors.firstName}
              />

              <Input
                label="Middle Name"
                placeholder="Enter middle name (optional)"
                value={formData.middleName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, middleName: text }))}
                autoCapitalize="words"
                error={formErrors.middleName}
              />

              <Input
                label="Last Name *"
                placeholder="Enter last name"
                value={formData.lastName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, lastName: text }))}
                autoCapitalize="words"
                error={formErrors.lastName}
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
                label="Phone Number *"
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                error={formErrors.phone}
              />

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Gender *</Text>
                <View style={styles.genderOptions}>
                  {[
                    { value: 1, label: 'Male' },
                    { value: 2, label: 'Female' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.genderOption,
                        formData.gender === option.value && styles.genderOptionSelected,
                      ]}
                      onPress={() => setFormData((prev) => ({ ...prev, gender: option.value as 1 | 2 }))}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          formData.gender === option.value && styles.genderOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {formErrors.gender && (
                  <Text style={styles.formErrorText}>{formErrors.gender}</Text>
                )}
              </View>

              <DateTimePicker
                label="Birth Date *"
                value={formData.birthDate}
                onChange={(date) => setFormData((prev) => ({ ...prev, birthDate: date }))}
                mode="date"
                format="YYYY-MM-DD"
                maximumDate={new Date()}
                error={formErrors.birthDate}
                placeholder="Select birth date"
              />

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (isCreating || !isFormValid) && styles.createButtonDisabled,
                ]}
                onPress={handleCreateStaff}
                disabled={isCreating || !isFormValid}
                activeOpacity={0.7}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <>
                    <Text style={styles.createButtonText}>Create Staff</Text>
                  </>
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

export default Staffs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  skeletonCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorMessageText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  staffCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  staffCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.greenLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 8,
  },
  staffDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  staffBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  userNumberBadge: {
    backgroundColor: colors.neutral.gray.lighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  userNumberText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.dark,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  inactiveBadge: {
    backgroundColor: colors.semantic.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inactiveText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
    color: colors.semantic.error,
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
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: colors.primary.green,
    backgroundColor: colors.primary.greenLight + '20',
  },
  genderOptionText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  genderOptionTextSelected: {
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  formErrorText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.semantic.error,
    marginTop: 4,
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
