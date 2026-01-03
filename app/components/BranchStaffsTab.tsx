import Skeleton from '@/components/Skeleton';
import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
  gender: number;
  birthDate: string;
  verified: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

interface BranchStaff {
  id: string;
  organizationId: string;
  branch_id: string;
  userId: string;
  isLocked: boolean;
  staff: Staff;
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

interface BranchStaffsTabProps {
  branchId: string;
}

const BranchStaffsTab: React.FC<BranchStaffsTabProps> = ({ branchId }) => {
  const [staffs, setStaffs] = useState<BranchStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [allStaffs, setAllStaffs] = useState<OrganizationStaff[]>([]);
  const [isLoadingAllStaffs, setIsLoadingAllStaffs] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [isAddingStaffs, setIsAddingStaffs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLockModalVisible, setIsLockModalVisible] = useState(false);
  const [lockingStaff, setLockingStaff] = useState<BranchStaff | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const fetchStaffs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<BranchStaff[]>(
        `/en/on/branch/${branchId}/staffs`,
        {
          requiresAuth: true,
        }
      );

      setStaffs(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load staffs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

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

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleOpenAddModal = async () => {
    setIsAddModalVisible(true);
    setSelectedStaffIds(new Set());
    setSearchQuery('');
    await fetchAllStaffs();
  };

  const fetchAllStaffs = useCallback(async () => {
    setIsLoadingAllStaffs(true);
    try {
      const response = await api.get<OrganizationStaff[]>('/en/on/staffs', {
        requiresAuth: true,
      });

      const allStaffsData = response.data || [];
      // Filter out staff that are already assigned to this branch and not locked
      const assignedStaffIds = new Set(
        staffs.filter((bs) => !bs.isLocked).map((bs) => bs.userId)
      );
      const availableStaffs = allStaffsData.filter(
        (orgStaff) => !assignedStaffIds.has(orgStaff.userId) && orgStaff.staff.active
      );
      setAllStaffs(availableStaffs);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load staffs. Please try again.', 'error');
    } finally {
      setIsLoadingAllStaffs(false);
    }
  }, [staffs]);

  const handleToggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  };

  const handleAddStaffs = async () => {
    if (selectedStaffIds.size === 0) {
      showToast('Please select at least one staff member', 'error');
      return;
    }

    setIsAddingStaffs(true);
    try {
      const staffIdsArray = Array.from(selectedStaffIds);
      const promises = staffIdsArray.map((userId) =>
        api.post(
          `/en/on/staff/${userId}`,
          {
            branchId: branchId,
          },
          {
            requiresAuth: true,
          }
        )
      );

      await Promise.all(promises);
      showToast('Staff assigned successfully', 'success');
      setIsAddModalVisible(false);
      setSelectedStaffIds(new Set());
      await fetchStaffs(); // Refresh the list
    } catch (err: any) {
      showToast(err?.message || 'Failed to assign staff. Please try again.', 'error');
    } finally {
      setIsAddingStaffs(false);
    }
  };

  const handleOpenLockModal = (branchStaff: BranchStaff) => {
    setLockingStaff(branchStaff);
    setLockReason('');
    setIsLockModalVisible(true);
  };

  const handleCloseLockModal = () => {
    setIsLockModalVisible(false);
    setLockingStaff(null);
    setLockReason('');
  };

  const handleSubmitLock = async () => {
    if (!lockingStaff || !lockReason.trim()) {
      showToast('Please provide a reason for this action', 'error');
      return;
    }

    setIsLocking(true);
    try {
      await api.patch(
        '/en/on/staff/branch/lock',
        {
          branchUserId: lockingStaff.id,
          reasons: lockReason.trim(),
          locked: !lockingStaff.isLocked,
        },
        {
          requiresAuth: true,
        }
      );

      showToast(
        `Staff ${lockingStaff.isLocked ? 'unlocked' : 'locked'} successfully`,
        'success'
      );
      handleCloseLockModal();
      await fetchStaffs(); // Refresh the list
    } catch (err: any) {
      showToast(err?.message || 'Failed to update staff status. Please try again.', 'error');
    } finally {
      setIsLocking(false);
    }
  };

  const filteredAllStaffs = allStaffs.filter((orgStaff) => {
    const staffName = getStaffName(orgStaff.staff).toLowerCase();
    const email = orgStaff.staff.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return staffName.includes(query) || email.includes(query);
  });

  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.staffCard}>
            <Skeleton width={50} height={50} borderRadius={25} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width="60%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={14} borderRadius={6} />
            </View>
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
          onPress={fetchStaffs}
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
        <Text style={styles.headerTitle}>Branch Staff</Text>
        <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={fetchStaffs}
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

      {staffs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>No staff members</Text>
          <Text style={styles.emptySubtext}>
            This branch doesn't have any staff members yet
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {staffs.map((branchStaff) => (
            <View key={branchStaff.id} style={styles.staffCard}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffAvatarText}>
                  {getStaffInitials(branchStaff.staff)}
                </Text>
              </View>
              <View style={styles.staffContent}>
                <View style={styles.staffHeader}>
                  <Text style={styles.staffName}>{getStaffName(branchStaff.staff)}</Text>
                  {branchStaff.isLocked && (
                    <View style={styles.lockedBadge}>
                      <Ionicons name="lock-closed" size={12} color={colors.semantic.error} />
                      <Text style={styles.lockedText}>Locked</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.staffEmail}>{branchStaff.staff.email}</Text>
                <View style={styles.staffInfo}>
                  <View style={styles.staffInfoItem}>
                    <Ionicons
                      name="call-outline"
                      size={14}
                      color={colors.neutral.gray.medium}
                    />
                    <Text style={styles.staffInfoText}>
                      {branchStaff.staff.phone.toString()}
                    </Text>
                  </View>
                  <View style={styles.staffInfoItem}>
                    <Ionicons
                      name="id-card-outline"
                      size={14}
                      color={colors.neutral.gray.medium}
                    />
                    <Text style={styles.staffInfoText}>
                      {branchStaff.staff.userNumber}
                    </Text>
                  </View>
                </View>
                <View style={styles.staffStatus}>
                  {branchStaff.staff.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={colors.primary.green} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                  {!branchStaff.staff.active && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveText}>Inactive</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.lockButton}
                onPress={() => handleOpenLockModal(branchStaff)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={branchStaff.isLocked ? 'lock-open-outline' : 'lock-closed-outline'}
                  size={18}
                  color={branchStaff.isLocked ? colors.primary.green : colors.semantic.error}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Staff Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff to Branch</Text>
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
                placeholder="Search staff..."
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

            {/* Staff List */}
            {isLoadingAllStaffs ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.green} />
                <Text style={styles.modalLoadingText}>Loading staff...</Text>
              </View>
            ) : filteredAllStaffs.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.neutral.gray.light} />
                <Text style={styles.modalEmptyText}>
                  {searchQuery ? 'No staff found' : 'No available staff'}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                {filteredAllStaffs.map((orgStaff) => {
                  const isSelected = selectedStaffIds.has(orgStaff.userId);
                  return (
                    <TouchableOpacity
                      key={orgStaff.id}
                      style={styles.staffSelectCard}
                      onPress={() => handleToggleStaffSelection(orgStaff.userId)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.staffSelectCheckbox,
                          isSelected && styles.staffSelectCheckboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
                        )}
                      </View>
                      <View style={styles.staffSelectAvatar}>
                        <Text style={styles.staffSelectAvatarText}>
                          {getStaffInitials(orgStaff.staff)}
                        </Text>
                      </View>
                      <View style={styles.staffSelectContent}>
                        <Text style={styles.staffSelectName} numberOfLines={1}>
                          {getStaffName(orgStaff.staff)}
                        </Text>
                        <Text style={styles.staffSelectEmail} numberOfLines={1}>
                          {orgStaff.staff.email}
                        </Text>
                        {orgStaff.staff.verified && (
                          <View style={styles.staffSelectVerified}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.primary.green} />
                            <Text style={styles.staffSelectVerifiedText}>Verified</Text>
                          </View>
                        )}
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
                  (selectedStaffIds.size === 0 || isAddingStaffs) && styles.modalAddButtonDisabled,
                ]}
                onPress={handleAddStaffs}
                disabled={selectedStaffIds.size === 0 || isAddingStaffs}
                activeOpacity={0.7}
              >
                {isAddingStaffs ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={styles.modalAddButtonText}>
                    Add ({selectedStaffIds.size})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lock/Unlock Staff Modal */}
      <Modal
        visible={isLockModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseLockModal}
      >
        <View style={styles.lockModalOverlay}>
          <View style={styles.lockModalContent}>
            <View style={styles.lockModalHeader}>
              <Text style={styles.lockModalTitle}>
                {lockingStaff?.isLocked ? 'Unlock Staff' : 'Lock Staff'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseLockModal}
                activeOpacity={0.7}
                disabled={isLocking}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.lockModalDescription}>
              {lockingStaff?.isLocked
                ? `Provide a reason for unlocking "${lockingStaff ? getStaffName(lockingStaff.staff) : 'this staff'}" from this branch.`
                : `Provide a reason for locking "${lockingStaff ? getStaffName(lockingStaff.staff) : 'this staff'}" from this branch.`}
            </Text>

            <View style={styles.lockReasonContainer}>
              <Text style={styles.lockReasonLabel}>Reason *</Text>
              <TextInput
                style={styles.lockReasonInput}
                placeholder="Enter reason for this action"
                placeholderTextColor={colors.neutral.gray.medium}
                value={lockReason}
                onChangeText={setLockReason}
                multiline
                numberOfLines={4}
                editable={!isLocking}
              />
            </View>

            {isLocking && (
              <View style={styles.lockModalLoading}>
                <ActivityIndicator size="small" color={colors.primary.green} />
                <Text style={styles.lockModalLoadingText}>
                  {lockingStaff?.isLocked ? 'Unlocking...' : 'Locking...'}
                </Text>
              </View>
            )}

            <View style={styles.lockModalButtons}>
              <TouchableOpacity
                style={[styles.lockModalButton, styles.lockModalCancelButton]}
                onPress={handleCloseLockModal}
                disabled={isLocking}
                activeOpacity={0.7}
              >
                <Text style={styles.lockModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.lockModalButton,
                  lockingStaff?.isLocked
                    ? styles.lockModalUnlockButton
                    : styles.lockModalLockButton,
                  (isLocking || !lockReason.trim()) && styles.lockModalButtonDisabled,
                ]}
                onPress={handleSubmitLock}
                disabled={isLocking || !lockReason.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.lockModalActionButtonText}>
                  {lockingStaff?.isLocked ? 'Unlock' : 'Lock'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default BranchStaffsTab;

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
  staffCard: {
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
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  lockedText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.semantic.error,
  },
  lockButton: {
    padding: 8,
  },
  staffAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  staffAvatarText: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  staffContent: {
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
  staffInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  staffInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  staffInfoText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  staffStatus: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  inactiveBadge: {
    backgroundColor: colors.neutral.gray.lighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inactiveText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.dark,
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
  staffSelectCard: {
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
  staffSelectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary.green,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffSelectCheckboxSelected: {
    backgroundColor: colors.primary.green,
    borderColor: colors.primary.green,
  },
  staffSelectAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffSelectAvatarText: {
    fontSize: 14,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  staffSelectContent: {
    flex: 1,
  },
  staffSelectName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  staffSelectEmail: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  staffSelectVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },
  staffSelectVerifiedText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
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
  // Lock/Unlock Modal Styles
  lockModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockModalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  lockModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockModalTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  lockModalDescription: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 20,
    lineHeight: 20,
  },
  lockReasonContainer: {
    marginBottom: 20,
  },
  lockReasonLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  lockReasonInput: {
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  lockModalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  lockModalLoadingText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.primary.green,
  },
  lockModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  lockModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  lockModalCancelButton: {
    backgroundColor: colors.neutral.gray.lighter,
  },
  lockModalCancelButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  lockModalLockButton: {
    backgroundColor: colors.semantic.error,
  },
  lockModalUnlockButton: {
    backgroundColor: colors.primary.green,
  },
  lockModalButtonDisabled: {
    backgroundColor: colors.neutral.gray.light,
    opacity: 0.6,
  },
  lockModalActionButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
});

