import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useCompanyStore } from '@/store/companyStore';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const BIOMETRIC_STORE_KEY = 'biometric_enabled';

const Profile = () => {
  const { user } = useUserStore();
  const { company } = useCompanyStore();
  const { branch } = useBranchStore();
  const { logout } = useAuthStore();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: '', type: 'info' });

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const getUserName = () => {
    if (!user) return 'User';
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User';
  };

  const getUserNumber = () => user?.userNumber || 'N/A';

  const loadBiometricSetting = useCallback(async () => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_STORE_KEY);
      setBiometricEnabled(enabled === 'true');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch {
      setBiometricAvailable(false);
    }
  }, []);

  useEffect(() => {
    loadBiometricSetting();
  }, [loadBiometricSetting]);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      if (!biometricAvailable) {
        setToast({
          visible: true,
          message: 'Biometrics are not available or not set up on this device.',
          type: 'error',
        });
        return;
      }
      setBiometricLoading(true);
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity to enable fingerprint login',
          cancelLabel: 'Cancel',
        });
        if (result.success) {
          await SecureStore.setItemAsync(BIOMETRIC_STORE_KEY, 'true');
          setBiometricEnabled(true);
          setToast({
            visible: true,
            message: 'Fingerprint login enabled. Sign in with your password once more to use fingerprint next time.',
            type: 'success',
          });
        } else {
          setToast({
            visible: true,
            message: 'Verification cancelled or failed.',
            type: 'info',
          });
        }
      } catch (err) {
        setToast({
          visible: true,
          message: 'Could not enable fingerprint. Please try again.',
          type: 'error',
        });
      } finally {
        setBiometricLoading(false);
      }
    } else {
      try {
        await SecureStore.setItemAsync(BIOMETRIC_STORE_KEY, 'false');
        setBiometricEnabled(false);
        setToast({
          visible: true,
          message: 'Fingerprint login disabled.',
          type: 'success',
        });
      } catch {
        setToast({
          visible: true,
          message: 'Could not update setting.',
          type: 'error',
        });
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/Login');
          },
        },
      ]
    );
  };

  const handleMenuItemPress = (item: string) => {
    if (item === 'Change Password') router.push('/ChangePassword');
    if (item === 'Update Profile') router.push('/UpdateProfile');
    if (item === 'Notifications') router.push('/Notification');
    if (item === 'Privacy Policy') router.push('/TermsAndPolicy');
  };

  const menuItems = [
    { id: 'update-profile', title: 'Update Profile', icon: 'person-outline' as const, route: 'Update Profile' },
    { id: 'change-password', title: 'Change Password', icon: 'lock-closed-outline' as const, route: 'Change Password' },
    { id: 'notifications', title: 'Notifications', icon: 'notifications-outline' as const, route: 'Notifications' },
    { id: 'policy', title: 'Privacy Policy', icon: 'document-text-outline' as const, route: 'Privacy Policy' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        

        {/* Profile hero card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[colors.primary.darkGreen, colors.primary.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.profileSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => handleMenuItemPress('Update Profile')}
                activeOpacity={0.9}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
                <View style={styles.editIconContainer}>
                  <Ionicons name="pencil" size={12} color={colors.text.inverse} />
                </View>
              </TouchableOpacity>
              <Text style={styles.userName}>{getUserName()}</Text>
              <Text style={styles.userId}>ID: {getUserNumber()}</Text>
              <View style={styles.memberBadge}>
                <Ionicons name="checkmark-circle" size={18} color={colors.text.inverse} />
                <Text style={styles.memberBadgeText}>Standard Member</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Account info card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="business-outline" size={20} color={colors.primary.green} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {company?.name || 'Not selected'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="location-outline" size={20} color={colors.primary.green} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Active Branch</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {branch?.name || 'Not selected'}
                </Text>
              </View>
            </View>
            {branch?.email && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary.green} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Branch Email</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {branch.email}
                    </Text>
                  </View>
                </View>
              </>
            )}
            {user?.email && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary.green} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>
              </>
            )}
            {user?.phone && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="call-outline" size={20} color={colors.primary.green} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{user.phone}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Security & fingerprint */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.fingerprintRow}>
              <View style={styles.menuItemLeft}>
                <View style={styles.fingerprintIconWrap}>
                  <Ionicons name="finger-print-outline" size={24} color={colors.primary.green} />
                </View>
                <View>
                  <Text style={styles.menuItemText}>
                    {Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Fingerprint login'}
                  </Text>
                  <Text style={styles.menuItemSubtext}>
                    {biometricAvailable
                      ? biometricEnabled
                        ? 'Use biometrics to sign in next time'
                        : 'Sign in with fingerprint when enabled'
                      : 'Not available on this device'}
                  </Text>
                </View>
              </View>
              {biometricAvailable && (
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={biometricLoading}
                  trackColor={{
                    false: colors.neutral.gray.lighter,
                    true: colors.primary.green + '80',
                  }}
                  thumbColor={biometricEnabled ? colors.primary.green : colors.neutral.gray.light}
                />
              )}
            </View>
          </View>
        </View>

        {/* Settings menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
                onPress={() => handleMenuItemPress(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon} size={22} color={colors.semantic.info} />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.neutral.gray.medium} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.semantic.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
 
  heroCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.text.inverse,
  },
  userName: {
    fontSize: 22,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  memberBadgeText: {
    fontSize: 13,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.medium,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.green + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.gray.lighter,
    marginLeft: 54,
  },
  fingerprintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  fingerprintIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.green + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.semantic.info + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
    flex: 1,
  },
  menuItemSubtext: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.semantic.error + '40',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.semantic.error,
  },
  footerSpacer: {
    height: 40,
  },
});
