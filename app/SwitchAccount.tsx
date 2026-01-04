import Button from '@/components/Button';
import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useCompanyStore } from '@/store/companyStore';
import { usePermissionsStore } from '@/store/permissionsStore';
import { useUserStore } from '@/store/userStore';
import { formatDate, formatSmartDate } from '@/utils/date';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Organization {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isServiceProvider: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Account {
  id: string;
  userId: string;
  active: boolean;
  isLocked: boolean;
  organization?: Organization;
  createdAt: number;
  updatedAt: number;
}

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

const SwitchAccount = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout, updateToken } = useAuthStore();
  const { setCompany } = useCompanyStore();
  const { user, setUser } = useUserStore();
  const { setBranch } = useBranchStore();
  const { setPermissions } = usePermissionsStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    setIsBranchModalVisible(false);
    try {
      const response = await api.get<Account[]>('/en/my/accounts', {
        requiresAuth: true,
      });

      // Filter accounts that have organization details
      const accountsWithOrganization = (response.data || []).filter(
        (account) => account.organization
      );

      setAccounts(accountsWithOrganization);
    } catch (err: any) {
      setError(err?.message || 'Failed to load accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async (organizationId: string) => {
    setIsLoadingBranches(true);
    setBranchError(null);
    setIsBranchModalVisible(true);
    try {
        
      const response = await api.get<Branch[]>(`/en/staff/branches/${organizationId}`, {
        requiresAuth: true,
      });

     
      setBranches(response.data || []);
      
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
      setBranchError(err?.message || 'Failed to load branches. Please try again.');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleSelectAccount = async (account: Account) => {
    if (account.organization) {
      setSelectedAccount(account);
      setSelectedOrganization(account.organization);
      // Fetch branches for the selected organization
      await fetchBranches(account.organization.id);
    }
  };

  // Helper function to normalize timestamp (handles both number and string)
  const normalizeTimestamp = (timestamp: number | string | undefined | null): string | undefined => {
    if (!timestamp) return undefined;
    if (typeof timestamp === 'string') return timestamp;
    // If it's a number, convert to ISO string
    const milliseconds = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    return new Date(milliseconds).toISOString();
  };

  const handleSelectBranch = async (branch: Branch) => {
    if (!selectedAccount || !selectedOrganization) {
      return;
    }

    setIsSwitchingAccount(true);
    setBranchError(null);

    try {
      // Make POST request to switch account
      const response = await api.post<{
        user: any;
        account: any;
        branch: Branch;
        accessToken: string;
      }>(
        '/en/switch/account',
        {
          accountId: selectedAccount.id,
          branchId: branch.id,
        },
        {
          requiresAuth: true,
        }
      );

      const { user: updatedUser, account, branch: selectedBranch, accessToken } = response.data;

      // Update token
      updateToken(accessToken);

      // Store user
      setUser({
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        userNumber: updatedUser.userNumber,
        email: updatedUser.email,
        phone: updatedUser.phone?.toString(),
        gender: updatedUser.gender,
        country: updatedUser.country,
        birthDate: updatedUser.birthDate,
        createdAt: normalizeTimestamp(updatedUser.createdAt),
        updatedAt: normalizeTimestamp(updatedUser.updatedAt),
      });

      // Store company/organization
      if (account.organization) {
        setCompany({
          id: account.organization.id,
          name: account.organization.name,
          description: account.organization.description || '',
          createdAt: normalizeTimestamp(account.organization.createdAt),
          updatedAt: normalizeTimestamp(account.organization.updatedAt),
        });
      }

      // Store branch
      setBranch(selectedBranch);

      // Close modal and clear state
      setIsBranchModalVisible(false);
      setBranches([]);
      setSelectedOrganization(null);
      setSelectedAccount(null);

      // After successfully switching account, fetch and set user permissions
      await fetchUserPermissions();

      // Navigate to home screen
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Failed to switch account:', err);
      setBranchError(err?.message || 'Failed to switch account. Please try again.');
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      const response = await api.get<string[]>('/en/auth/user/permissions', {
        requiresAuth: true,
      });
      setPermissions(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch user permissions:', err);
      // Set empty permissions on error
      setPermissions([]);
    }
  };

  const handleCloseBranchModal = () => {
    setIsBranchModalVisible(false);
    setBranches([]);
    setSelectedOrganization(null);
    setBranchError(null);
  };



  const handleLogout = () => {
    logout();
    router.replace('/Login');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Image source={require('../assets/images/diracks.png')} style={styles.headerIcon} />
            <Text style={styles.headerIconText}>Diracks</Text>
          </View>
          {user && (
            <View style={styles.userGreeting}>
              <Text style={styles.subtitle}>
                Welcome
              </Text>
              <Text style={styles.title}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}</Text>
            </View>
          )}
          <Text style={styles.subtitle}>Select an organization to continue</Text>
        </View>

        {/* Loading State - Skeleton */}
        {isLoading && (
          <View style={styles.accountsContainer}>
            {[1, 2, 3].map((index) => (
              <View key={index} style={styles.accountCardSkeleton}>
                <View style={styles.cardContentSkeleton}>
                  <View style={styles.topSection}>
                    <Skeleton width="40%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                    <Skeleton width="70%" height={20} borderRadius={8} />
                  </View>
                  <View style={styles.bottomSection}>
                    <View style={styles.bottomLeft}>
                      <Skeleton width="60%" height={13} borderRadius={6} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Retry"
              variant="outline"
              onPress={fetchAccounts}
              style={styles.retryButton}
            />
          </View>
        )}

        {/* Accounts List */}
        {!isLoading && !error && accounts.length > 0 && (
          <View style={styles.accountsContainer}>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountCard}
                onPress={() => handleSelectAccount(account)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.primary.darkGreen, colors.primary.green, colors.primary.darkGreen]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardGradient}
                >
                  {/* Pattern Overlay - Concentric Circles */}
                  <View style={styles.patternOverlay}>
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />
                    <View style={styles.circle3} />
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardContent}>
                    {/* Top Section - Organization Name (like $24 986) */}
                    <View style={styles.topSection}>
                      <Text style={styles.organizationName} numberOfLines={1}>
                        {account.organization?.name || 'Organization'}
                      </Text>
                      <Text style={styles.organizationType}>
                        {'Service Provider' }
                      </Text>
                    </View>

                    {/* Bottom Section */}
                    <View style={styles.bottomSection}>
                      <View style={styles.bottomLeft}>
                        <Text style={styles.accountStatus}>
                          Created {formatSmartDate(account.createdAt)}
                        </Text>
                      </View>
                     
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

            {/* Empty State */}
            {!isLoading && !error && !isSwitchingAccount && accounts.length === 0 && (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No organizations found</Text>
            <Text style={styles.emptySubtext}>
              You don't have access to any organizations yet.
            </Text>
          </View>
        )}

        {/* Logout Button */}
        <View style={styles.footer}>
          <Button
            title="Logout"
            variant="outline-danger"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>

      {/* Branches Modal */}
      <Modal
        visible={isBranchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseBranchModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Branch
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedOrganization?.name}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseBranchModal}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Loading State - Skeleton */}
            {isLoadingBranches && (
              <View style={styles.modalScrollContainer}>
                <ScrollView
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {[1, 2, 3].map((index) => (
                    <View key={index} style={styles.branchCardSkeleton}>
                      <ImageBackground
                        source={require('../assets/backgroud/background-cards.jpg')}
                        style={styles.branchCardBackground}
                        imageStyle={styles.branchCardImage}
                      >
                        <View style={styles.branchPatternOverlay}>
                          <View style={styles.branchCircle1} />
                          <View style={styles.branchCircle2} />
                          <View style={styles.branchCircle3} />
                        </View>
                        <View style={styles.branchCardContent}>
                          <View style={styles.branchTopLeft}>
                            <Skeleton width="35%" height={13} borderRadius={6} />
                          </View>
                          <View style={styles.branchMainSection}>
                            <Skeleton width="80%" height={32} borderRadius={8} />
                          </View>
                          <View style={styles.branchBottomSection}>
                            <View style={styles.branchBottomLeft}>
                              <Skeleton width="70%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                              <Skeleton width="50%" height={12} borderRadius={6} />
                            </View>
                          </View>
                        </View>
                      </ImageBackground>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Switching Account State */}
            {isSwitchingAccount && (
              <View style={styles.modalCenterContainer}>
                <ActivityIndicator size="large" color={colors.primary.green} />
                <Text style={styles.modalLoadingText}>Processing Please Wait...</Text>
              </View>
            )}

            {/* Error State */}
            {!isLoadingBranches && !isSwitchingAccount && branchError && (
              <View style={styles.modalErrorContainer}>
                <Text style={styles.modalErrorText}>{branchError}</Text>
                <Button
                  title="Retry"
                  variant="outline"
                  onPress={() => selectedOrganization && fetchBranches(selectedOrganization.id)}
                  style={styles.modalRetryButton}
                />
              </View>
            )}

            {/* Branches List */}
            {!isLoadingBranches && !isSwitchingAccount && !branchError && branches.length > 0 && (
              <View style={styles.modalScrollContainer}>
                <ScrollView
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {branches.map((branch) => (
                    <TouchableOpacity
                      key={branch.id}
                      style={styles.branchCard}
                      onPress={() => handleSelectBranch(branch)}
                      activeOpacity={0.9}
                      disabled={isSwitchingAccount}
                    >
                      <ImageBackground
                        source={require('../assets/backgroud/background-cards.jpg')}
                        style={styles.branchCardBackground}
                        imageStyle={styles.branchCardImage}
                      >
                        {/* Pattern Overlay - Concentric Circles */}
                        <View style={styles.branchPatternOverlay}>
                          <View style={styles.branchCircle1} />
                          <View style={styles.branchCircle2} />
                          <View style={styles.branchCircle3} />
                        </View>

                        {/* Card Content */}
                        <View style={styles.branchCardContent}>
                          {/* Top Left - Branch Type/Label */}
                          <View style={styles.branchTopLeft}>
                            <Text style={styles.branchLabel}>
                              {branch.isMain ? 'Main Branch' : 'Branch Location'}
                            </Text>
                          </View>

                          {/* Main Value - Branch Name */}
                          <View style={styles.branchMainSection}>
                            <Text style={styles.branchMainName} numberOfLines={2}>
                              {branch.name}
                            </Text>
                          </View>

                          {/* Bottom Section */}
                          <View style={styles.branchBottomSection}>
                            <View style={styles.branchBottomLeft}>
                              <Text style={styles.branchLocationText} numberOfLines={1}>
                                📍 {branch.location}
                              </Text>
                              {branch.description && (
                                <Text style={styles.branchDescriptionText} numberOfLines={1}>
                                  {branch.description}
                                </Text>
                              )}
                              <View style={styles.branchDateContainer}>
                                <Text style={styles.branchDateText}>
                                  Created {formatDate(branch.createdAt)}
                                </Text>
                              </View>
                            </View>
                            {branch.isMain && (
                              <View style={styles.branchMainBadge}>
                                <Text style={styles.branchMainBadgeText}>Main</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Empty State */}
            {!isLoadingBranches && !branchError && branches.length === 0 && (
              <View style={styles.modalCenterContainer}>
                <Text style={styles.modalEmptyText}>No branches found</Text>
                <Text style={styles.modalEmptySubtext}>
                  This organization doesn't have any branches yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SwitchAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  headerIconText: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginLeft: 10,
  },
  userGreeting: {
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.semantic.error,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    alignSelf: 'center',
  },
  accountsContainer: {
    marginBottom: 24,
  },
  accountCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
    minHeight: 150,
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: colors.text.inverse,
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: colors.text.inverse,
    top: -30,
    right: -30,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.text.inverse,
    top: -20,
    right: -20,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  topSection: {
    marginBottom: 32,
  },
  organizationName: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  organizationType: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomLeft: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  accountStatus: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  toggleContainer: {
    marginLeft: 16,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.inverse,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  logoutButton: {
    width: '100%',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '80%',
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  modalScrollContainer: {
    flex: 1,
    marginTop: 20,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  modalCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 14,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
  },
  modalErrorContainer: {
    padding: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.semantic.error,
    marginHorizontal: 24,
    marginTop: 20,
  },
  modalErrorText: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalRetryButton: {
    alignSelf: 'center',
  },
  modalEmptyText: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  modalEmptySubtext: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    textAlign: 'center',
  },
  // Branch Card Styles
  branchCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  branchCardBackground: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 200,
  },
  branchCardImage: {
    borderRadius: 20,
    resizeMode: 'cover',
    opacity: 0.9,
  },
  branchPatternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  branchCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: colors.text.inverse,
    top: -40,
    right: -40,
  },
  branchCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: colors.text.inverse,
    top: -30,
    right: -30,
  },
  branchCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.text.inverse,
    top: -20,
    right: -20,
  },
  branchCardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  branchTopLeft: {
    marginBottom: 12,
  },
  branchLabel: {
    fontSize: 13,
    fontFamily: fonts.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  branchMainSection: {
    marginBottom: 24,
  },
  branchMainName: {
    fontSize: 32,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  branchBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  branchBottomLeft: {
    flex: 1,
    marginRight: 12,
  },
  branchLocationText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
    marginBottom: 6,
    opacity: 0.9,
  },
  branchDescriptionText: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  branchDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  branchDateText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  branchMainBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  branchMainBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  // Skeleton Styles
  accountCardSkeleton: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContentSkeleton: {
    borderRadius: 20,
    padding: 20,
    minHeight: 150,
    backgroundColor: 'transparent',
  },
  branchCardSkeleton: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
