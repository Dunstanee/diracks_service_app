import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

interface Account {
  id: string;
  userId: string;
  active: boolean;
  isLocked: boolean;
  organization: {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    isServiceProvider: boolean;
    createdAt: number;
    updatedAt: number;
  };
  createdAt: number;
  updatedAt: number;
}

interface Permission {
  id: string;
  name: string;
  type: string;
  account: string;
  createdAt: number;
  updatedAt: number;
}

interface ViewStaffPermissionsTabProps {
  userId: string;
}

const ViewStaffPermissionsTab: React.FC<ViewStaffPermissionsTabProps> = ({ userId }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoadingAllPermissions, setIsLoadingAllPermissions] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [isAssigningPermissions, setIsAssigningPermissions] = useState(false);
  const [isRemovingPermission, setIsRemovingPermission] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const fetchAccount = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<Account>(`/en/on/organization/staff/${userId}/account`, {
        requiresAuth: true,
      });

      if (response.data) {
        setAccountId(response.data.id);
        return response.data.id;
      }
      return null;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to load account. Please try again.');
    }
  }, [userId]);

  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First fetch the account to get accountId
      const userAccountId = accountId || await fetchAccount();
      
      if (!userAccountId) {
        setError('Account ID not found');
        setIsLoading(false);
        return;
      }

      // Then fetch permissions using accountId
      const response = await api.get<string[]>(`/en/on/user/permission/${userAccountId}`, {
        requiresAuth: true,
      });

      setPermissions(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, accountId, fetchAccount]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleOpenAddModal = async () => {
    setIsAddModalVisible(true);
    setSelectedPermissionIds(new Set());
    setSearchQuery('');
    await fetchAllPermissions();
  };

  const fetchAllPermissions = useCallback(async () => {
    setIsLoadingAllPermissions(true);
    try {
      const response = await api.get<Permission[]>('/en/on/organization/permissions', {
        requiresAuth: true,
      });

      const allPermissionsData = response.data || [];
      // Filter out permissions that are already assigned
      const assignedPermissionNames = new Set(permissions);
      const availablePermissions = allPermissionsData.filter(
        (permission) => !assignedPermissionNames.has(permission.name)
      );
      setAllPermissions(availablePermissions);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load permissions. Please try again.', 'error');
    } finally {
      setIsLoadingAllPermissions(false);
    }
  }, [permissions]);

  const handleTogglePermissionSelection = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleAssignPermissions = async () => {
    if (!accountId || selectedPermissionIds.size === 0) {
      return;
    }

    setIsAssigningPermissions(true);
    try {
      await api.post(
        `/en/on/assign/staff/${accountId}/permissions`,
        {
          permissionId: Array.from(selectedPermissionIds),
        },
        {
          requiresAuth: true,
        }
      );

      showToast('Permissions assigned successfully', 'success');
      setIsAddModalVisible(false);
      setSelectedPermissionIds(new Set());
      await fetchPermissions(); // Refresh permissions list
    } catch (err: any) {
      showToast(err?.message || 'Failed to assign permissions. Please try again.', 'error');
    } finally {
      setIsAssigningPermissions(false);
    }
  };

  const handleRemovePermission = async (permissionName: string) => {
    if (!accountId) return;

    // Fetch all permissions to find the ID
    try {
      const allPermsResponse = await api.get<Permission[]>('/en/on/organization/permissions', {
        requiresAuth: true,
      });

      const allPerms = allPermsResponse.data || [];
      const permission = allPerms.find((p) => p.name === permissionName);

      if (!permission) {
        showToast('Permission not found', 'error');
        return;
      }

      Alert.alert(
        'Remove Permission',
        `Are you sure you want to remove "${permissionName}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              setIsRemovingPermission(permission.id);
              try {
                await api.delete(`/en/on/remove/staff/${accountId}/permission/${permission.id}`, {
                  requiresAuth: true,
                });

                showToast('Permission removed successfully', 'success');
                await fetchPermissions(); // Refresh permissions list
              } catch (err: any) {
                showToast(err?.message || 'Failed to remove permission. Please try again.', 'error');
              } finally {
                setIsRemovingPermission(null);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      showToast('Failed to load permission details. Please try again.', 'error');
    }
  };

  const filteredAllPermissions = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPermissions;
    }
    const query = searchQuery.toLowerCase();
    return allPermissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(query) ||
        permission.type.toLowerCase().includes(query)
    );
  }, [allPermissions, searchQuery]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading permissions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Permissions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenAddModal}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {permissions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="shield-outline" size={64} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>No permissions assigned</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.permissionsGrid}>
            {permissions.map((permissionName, index) => (
              <View key={index} style={styles.permissionCard}>
                <View style={styles.permissionCardContent}>
                  <View style={styles.permissionIconContainer}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary.green} />
                  </View>
                  <Text style={styles.permissionText} numberOfLines={2}>
                    {permissionName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePermission(permissionName)}
                  disabled={isRemovingPermission !== null}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color={colors.semantic.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add Permissions Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Permissions</Text>
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
                placeholder="Search permissions..."
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

            {/* Permissions List */}
            {isLoadingAllPermissions ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.green} />
                <Text style={styles.modalLoadingText}>Loading permissions...</Text>
              </View>
            ) : filteredAllPermissions.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Ionicons name="shield-outline" size={48} color={colors.neutral.gray.light} />
                <Text style={styles.modalEmptyText}>
                  {searchQuery ? 'No permissions found' : 'No available permissions'}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredAllPermissions.map((permission) => {
                  const isSelected = selectedPermissionIds.has(permission.id);
                  return (
                    <TouchableOpacity
                      key={permission.id}
                      style={styles.permissionSelectCard}
                      onPress={() => handleTogglePermissionSelection(permission.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.permissionSelectCheckbox,
                          isSelected && styles.permissionSelectCheckboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
                        )}
                      </View>
                      <View style={styles.permissionSelectContent}>
                        <View style={styles.permissionSelectHeader}>
                          <Text style={styles.permissionSelectName} numberOfLines={1}>
                            {permission.name}
                          </Text>
                          <View style={styles.permissionTypeBadge}>
                            <Text style={styles.permissionTypeText}>{permission.type}</Text>
                          </View>
                        </View>
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
                  (selectedPermissionIds.size === 0 || isAssigningPermissions) &&
                    styles.modalAddButtonDisabled,
                ]}
                onPress={handleAssignPermissions}
                disabled={selectedPermissionIds.size === 0 || isAssigningPermissions}
                activeOpacity={0.7}
              >
                {isAssigningPermissions ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={styles.modalAddButtonText}>
                    Assign ({selectedPermissionIds.size})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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

export default ViewStaffPermissionsTab;

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
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  permissionCard: {
    width: '100%',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  removeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
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
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  searchIcon: {
    marginRight: 8,
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
  modalScrollContent: {
    paddingBottom: 20,
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
  permissionSelectCard: {
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
  permissionSelectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary.green,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionSelectCheckboxSelected: {
    backgroundColor: colors.primary.green,
    borderColor: colors.primary.green,
  },
  permissionSelectContent: {
    flex: 1,
  },
  permissionSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionSelectName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  permissionTypeBadge: {
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  permissionTypeText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
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
    borderRadius: 8,
    backgroundColor: colors.primary.green,
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
});

