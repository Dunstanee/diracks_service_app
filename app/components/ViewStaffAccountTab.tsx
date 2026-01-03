import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { formatDateCustom } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

interface ViewStaffAccountTabProps {
  userId: string;
}

const ViewStaffAccountTab: React.FC<ViewStaffAccountTabProps> = ({ userId }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLockModalVisible, setIsLockModalVisible] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [isLocking, setIsLocking] = useState(false);
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

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Account>(`/en/on/organization/staff/${userId}/account`, {
        requiresAuth: true,
      });

      setAccount(response.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load account details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleOpenLockModal = () => {
    setLockReason('');
    setIsLockModalVisible(true);
  };

  const handleCloseLockModal = () => {
    setIsLockModalVisible(false);
    setLockReason('');
  };

  const handleLockAccount = async (locked: boolean) => {
    if (!account) return;

    if (!lockReason.trim()) {
      showToast('Please provide a reason for this action', 'error');
      return;
    }

    setIsLocking(true);
    try {
      await api.patch(
        '/en/on/organization/staff/account/lock',
        {
          accountId: account.id,
          reasons: lockReason.trim(),
          locked: locked,
        },
        {
          requiresAuth: true,
        }
      );

      showToast(locked ? 'Account locked successfully' : 'Account unlocked successfully', 'success');
      handleCloseLockModal();
      await fetchAccount(); // Refresh account data
    } catch (err: any) {
      showToast(err?.message || 'Failed to update account status. Please try again.', 'error');
    } finally {
      setIsLocking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading account details...</Text>
      </View>
    );
  }

  if (error || !account) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error || 'Account not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAccount} activeOpacity={0.7}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Account Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  account.active
                    ? { backgroundColor: colors.primary.greenLight + '20' }
                    : { backgroundColor: colors.semantic.error + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    account.active ? { color: colors.primary.green } : { color: colors.semantic.error },
                  ]}
                >
                  {account.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Lock Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  account.isLocked
                    ? { backgroundColor: colors.semantic.error + '20' }
                    : { backgroundColor: colors.primary.greenLight + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    account.isLocked ? { color: colors.semantic.error } : { color: colors.primary.green },
                  ]}
                >
                  {account.isLocked ? 'Locked' : 'Unlocked'}
                </Text>
              </View>
            </View>
          </View>

          {/* Lock/Unlock Button */}
          <TouchableOpacity
            style={[
              styles.lockButton,
              account.isLocked ? styles.unlockButton : styles.lockButtonStyle,
            ]}
            onPress={handleOpenLockModal}
            activeOpacity={0.7}
          >
            <Ionicons
              name={account.isLocked ? 'lock-open-outline' : 'lock-closed-outline'}
              size={20}
              color={colors.text.inverse}
            />
            <Text style={styles.lockButtonText}>
              {account.isLocked ? 'Unlock Account' : 'Lock Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Organization Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={20} color={colors.neutral.gray.medium} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Organization Name</Text>
              <Text style={styles.detailValue}>{account.organization.name}</Text>
            </View>
          </View>

          {account.organization.description && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={20} color={colors.neutral.gray.medium} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{account.organization.description}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.neutral.gray.medium} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service Provider</Text>
              <Text style={styles.detailValue}>
                {account.organization.isServiceProvider ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={colors.neutral.gray.medium} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {formatDateCustom(account.createdAt, 'MM/DD/YYYY')}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="refresh-outline" size={20} color={colors.neutral.gray.medium} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Last Updated</Text>
              <Text style={styles.detailValue}>
                {formatDateCustom(account.updatedAt, 'MM/DD/YYYY')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Lock/Unlock Modal */}
      <Modal
        visible={isLockModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseLockModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {account.isLocked ? 'Unlock Account' : 'Lock Account'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseLockModal}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalDescription}>
                Please provide a reason for {account.isLocked ? 'unlocking' : 'locking'} this account.
              </Text>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Reason *</Text>
                <TextInput
                  style={styles.formTextArea}
                  placeholder="Enter reason for this action"
                  placeholderTextColor={colors.neutral.gray.medium}
                  value={lockReason}
                  onChangeText={setLockReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCloseLockModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    account.isLocked ? styles.unlockConfirmButton : styles.lockConfirmButton,
                    isLocking && styles.confirmButtonDisabled,
                  ]}
                  onPress={() => handleLockAccount(!account.isLocked)}
                  disabled={isLocking}
                  activeOpacity={0.7}
                >
                  {isLocking ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      {account.isLocked ? 'Unlock' : 'Lock'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
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

export default ViewStaffAccountTab;

const styles = StyleSheet.create({
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
  section: {
    marginBottom: 24,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  lockButtonStyle: {
    backgroundColor: colors.semantic.error,
  },
  unlockButton: {
    backgroundColor: colors.primary.green,
  },
  lockButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
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
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 20,
    lineHeight: 20,
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
  formTextArea: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    padding: 12,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.neutral.gray.lighter,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  lockConfirmButton: {
    backgroundColor: colors.semantic.error,
  },
  unlockConfirmButton: {
    backgroundColor: colors.primary.green,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
});

