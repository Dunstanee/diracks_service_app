import Toast, { ToastType } from '@/components/Toast';
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
import BranchDetailsTab from './components/BranchDetailsTab';
import BranchServicesTab from './components/BranchServicesTab';
import BranchStaffsTab from './components/BranchStaffsTab';

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

type TabType = 'details' | 'services' | 'staffs';

const BranchDetails = () => {
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const fetchBranchDetails = useCallback(async () => {
    if (!branchId) {
      setError('Branch ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Branch>(`/en/on/branch/${branchId}`, {
        requiresAuth: true,
      });

      setBranch(response.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load branch details. Please try again.');
      showToast(err?.message || 'Failed to load branch details. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchBranchDetails();
  }, [fetchBranchDetails]);

  const towBanner = require('@/assets/backgroud/tow.jpg');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading branch details...</Text>
      </View>
    );
  }

  if (error || !branch) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error || 'Branch not found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchBranchDetails}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Banner */}
        <View style={styles.bannerContainer}>
          <ImageBackground
            source={towBanner}
            style={styles.banner}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
              style={styles.bannerGradient}
            />
            <View style={styles.bannerContent}>
              <Text style={styles.branchTitle}>{branch.name}</Text>
              {branch.isMain && (
                <View style={styles.mainBadge}>
                  <Ionicons name="star" size={14} color={colors.secondary.orange} />
                  <Text style={styles.mainBadgeText}>Main Branch</Text>
                </View>
              )}
            </View>
          </ImageBackground>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'details' && styles.activeTabText,
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'services' && styles.activeTabText,
              ]}
            >
              Services
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'staffs' && styles.activeTab]}
            onPress={() => setActiveTab('staffs')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'staffs' && styles.activeTabText,
              ]}
            >
              Staffs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'details' && <BranchDetailsTab branch={branch} />}
          {activeTab === 'services' && <BranchServicesTab branchId={branchId!} />}
          {activeTab === 'staffs' && <BranchStaffsTab branchId={branchId!} />}
        </View>
      </ScrollView>
    </>
  );
};

export default BranchDetails;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.neutral.gray.lighter,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  headerSpacer: {
    flex: 1,
  },
  bannerContainer: {
    width: '100%',
    height: 250,
  },
  banner: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    padding: 20,
    paddingBottom: 30,
  },
  branchTitle: {
    fontSize: 32,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    marginBottom: 8,
  },
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary.orangeLight + 'CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  mainBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary.green,
  },
  tabText: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
  },
  activeTabText: {
    color: colors.primary.green,
    fontFamily: fonts.weights.semiBold,
  },
  tabContent: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
