import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ViewStaffAccountTab from './components/ViewStaffAccountTab';
import ViewStaffBranchesTab from './components/ViewStaffBranchesTab';
import ViewStaffDetailsTab from './components/ViewStaffDetailsTab';
import ViewStaffPermissionsTab from './components/ViewStaffPermissionsTab';

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

interface OrganizationStaff {
  id: string;
  organizationId: string;
  userId: string;
  staff: Staff;
  createdAt: number;
  updatedAt: number;
}

type TabType = 'details' | 'branches' | 'permissions' | 'account';

const ViewStaff = () => {
  const { organizationStaffId } = useLocalSearchParams<{ organizationStaffId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [staffData, setStaffData] = useState<OrganizationStaff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffDetails = useCallback(async () => {
    if (!organizationStaffId) {
      setError('Staff ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<OrganizationStaff>(
        `/en/on/staff/${organizationStaffId}/details`,
        {
          requiresAuth: true,
        }
      );

      setStaffData(response.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationStaffId]);

  useEffect(() => {
    fetchStaffDetails();
  }, [fetchStaffDetails]);

  const getStaffName = (staff: Staff): string => {
    return [staff.firstName, staff.middleName, staff.lastName]
      .filter(Boolean)
      .join(' ') || staff.email || 'Staff';
  };

  const getStaffInitials = (staff: Staff): string => {
    const firstName = staff.firstName || '';
    const lastName = staff.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'S';
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading staff details...</Text>
      </View>
    );
  }

  if (error || !staffData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error || 'Staff not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStaffDetails} activeOpacity={0.7}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const staff = staffData.staff;

  return (
    <View style={styles.container}>
      {/* Banner Section */}
      <ImageBackground
        source={require('@/assets/backgroud/staff-background.png')}
        style={styles.banner}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.4)']}
          style={styles.bannerOverlay}
        >
          <View style={styles.bannerContent}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButtonBanner}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </TouchableOpacity>

            {/* Staff Info on Banner */}
            <View style={styles.bannerInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{getStaffInitials(staff)}</Text>
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.staffName}>{getStaffName(staff)}</Text>
                <Text style={styles.staffEmail}>{staff.email}</Text>
                <View style={styles.bannerBadges}>
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
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={activeTab === 'details' ? colors.primary.green : colors.neutral.gray.medium}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'details' && styles.tabTextActive,
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'branches' && styles.tabActive]}
            onPress={() => setActiveTab('branches')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={activeTab === 'branches' ? colors.primary.green : colors.neutral.gray.medium}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'branches' && styles.tabTextActive,
              ]}
            >
              Branches
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'permissions' && styles.tabActive]}
            onPress={() => setActiveTab('permissions')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={activeTab === 'permissions' ? colors.primary.green : colors.neutral.gray.medium}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'permissions' && styles.tabTextActive,
              ]}
            >
              Permissions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'account' && styles.tabActive]}
            onPress={() => setActiveTab('account')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={activeTab === 'account' ? colors.primary.green : colors.neutral.gray.medium}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'account' && styles.tabTextActive,
              ]}
            >
              Account
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'details' && <ViewStaffDetailsTab staff={staff} organizationStaffId={organizationStaffId} />}
        {activeTab === 'branches' && <ViewStaffBranchesTab organizationStaffId={staff.id} />}
        {activeTab === 'permissions' && <ViewStaffPermissionsTab userId={staff.id} />}
        {activeTab === 'account' && <ViewStaffAccountTab userId={staff.id} />}
      </View>
    </View>
  );
};

export default ViewStaff;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 24,
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
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  backButton: {
    backgroundColor: colors.neutral.gray.lighter,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  banner: {
    width: '100%',
    height: 190,
  },
  bannerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bannerContent: {
    padding: 20,
    paddingBottom: 24,
  },
  backButtonBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.greenLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.text.inverse,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  bannerTextContainer: {
    flex: 1,
  },
  staffName: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: 8,
  },
  bannerBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userNumberBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  userNumberText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.green + 'CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  inactiveBadge: {
    backgroundColor: colors.semantic.error + 'CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inactiveText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  tabsContainer: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary.green,
  },
  tabText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  tabTextActive: {
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  tabContent: {
    flex: 1,
  },
});
