import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useCompanyStore } from '@/store/companyStore';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const Profile = () => {
  const { user } = useUserStore();
  const { company } = useCompanyStore();
  const { branch } = useBranchStore();
  const { logout } = useAuthStore();

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

  const getUserNumber = () => {
    // Extract user number from email or use a default
    return user?.userNumber || 'N/A';
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
    if (item === 'Change Password') {
      router.push('/ChangePassword');
    }
    if (item === 'Update Profile') {
      router.push('/UpdateProfile');
    }
    // Handle navigation to different screens
    console.log('Navigate to:', item);
    // You can add navigation logic here
    // router.push(`/${item.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const menuItems = [
    {
      id: 'update-profile',
      title: 'Update Profile',
      icon: 'person-outline',
      onPress: () => handleMenuItemPress('Update Profile'),
    },
    {
      id: 'change-password',
      title: 'Change Password',
      icon: 'lock-closed-outline',
      onPress: () => handleMenuItemPress('Change Password'),
    },
    {
      id: 'fingerprint',
      title: 'Fingerprint',
      icon: 'finger-print-outline',
      onPress: () => handleMenuItemPress('Fingerprint'),
    },
    {
      id: 'two-step',
      title: 'Two-Step Verification',
      icon: 'shield-checkmark-outline',
      onPress: () => handleMenuItemPress('Two-Step Verification'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => handleMenuItemPress('Notifications'),
    },
    {
      id: 'policy',
      title: 'Privacy Policy',
      icon: 'document-text-outline',
      onPress: () => handleMenuItemPress('Privacy Policy'),
    },
  ];

  return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
            <TouchableOpacity
              style={styles.editIconContainer}
              activeOpacity={0.7}
              onPress={() => handleMenuItemPress('Update Profile')}
            >
              <Ionicons name="pencil" size={14} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{getUserName()}</Text>
          <Text style={styles.userId}>ID No: {getUserNumber()}</Text>
        </View>

        {/* Member Status Badge */}
        <View style={styles.memberBadgeContainer}>
          <View style={styles.memberBadge}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
            </View>
            <Text style={styles.memberBadgeText}>Standard Member</Text>
          </View>
        </View>

        {/* Account Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color={colors.primary.green} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {company?.name || 'Not selected'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary.green} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Active Branch</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {branch?.name || 'Not selected'}
                </Text>
              </View>
            </View>
          </View>

          {branch && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={colors.primary.green} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Branch Email</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {branch.email}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {user?.email && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={colors.primary.green} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {user?.phone && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={colors.primary.green} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Settings</Text>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={colors.semantic.info}
                  />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.neutral.gray.medium}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.semantic.error,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.primary,
  },
  avatarText: {
    fontSize: 36,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.semantic.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  memberBadgeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEB3B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.neutral.gray.light,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberBadgeText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  infoCard: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  settingsSection: {
    paddingTop: 24,
    backgroundColor: colors.background.primary,
  },
  settingsTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  menuItemLast: {
    borderBottomWidth: 0,
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
    backgroundColor: colors.semantic.info + '15',
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
});
