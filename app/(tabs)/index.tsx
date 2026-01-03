import type { IncomingRequest } from '@/components/IncomingRequestsComponent';
import IncomingRequestsComponent from '@/components/IncomingRequestsComponent';
import ServiceStats from '@/components/ServiceStats';
import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useCompanyStore } from '@/store/companyStore';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ServiceMode {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ThumbNail {
  id: string;
  name: string;
  systemName: string;
  fileSize: number;
  mimeType: string;
  fileSource: string;
  userId: string;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Service {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isPublic: boolean;
  isDeleted: boolean;
  modeId: number;
  staffId: string;
  thumbNailId: string | null;
  thumbNail: ThumbNail | null;
  mode: ServiceMode;
  createdAt: number;
  updatedAt: number;
}


const actionCards = [
  {
    id: 'finance',
    title: 'Finance',
    icon: 'wallet-outline',
    color: colors.primary.green,
    route: '/FinanceBreakSummary',
  },
  {
    id: 'Staff',
    title: 'Members',
    icon: 'people-outline',
    color: colors.secondary.orange,
    route: '/Staffs',
  },
  {
    id: 'Branches',
    title: 'Branches',
    icon: 'business-outline',
    color: colors.semantic.info,
    route: '/Branches',
  },
  {
    id: 'history',
    title: 'History',
    icon: 'time-outline',
    color: colors.semantic.info,
    route: '/BookingHistory',
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: 'document-text-outline',
    color: colors.semantic.error,
    route: '/InvoiceHistory',
  },
  {
    id: 'plans',
    title: 'Plans',
    icon: 'card-outline',
    color: colors.primary.greenDark,
    route: '/SubscriptionPlans',
  },
];

const Home = () => {
  const { user } = useUserStore();
  const { company } = useCompanyStore();
  const { branch } = useBranchStore();
  const { logout } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
  const [ongoingRequestsCount, setOngoingRequestsCount] = useState(0);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [license, setLicense] = useState<{
    id: string;
    organizationId: string;
    subscriptionId: string;
    totalSlots: number;
    used_slots: number;
    available_slots: number;
    renewalDate: string;
    expiryDate: string;
    transactionId: string;
    staffId: string;
    subscription: {
      id: string;
      title: string;
      subscriptionCode: string;
      noOfBranches: string;
      members: string;
      tadarVisibility: string;
      teamManagement: boolean;
      services: string;
      assistanceSupport: string;
      reports: boolean;
      noOfMonth: number;
      isRenewed: boolean;
      price: number;
      active: boolean;
      createdAt: number;
      updatedAt: number;
    };
    isExpired: boolean;
    isInfinity: boolean;
    createdAt: number;
    updatedAt: number;
  } | null>(null);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

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

  const getImageUri = useCallback(async (systemName: string, serviceId: string): Promise<void> => {
    if (imageUris[serviceId] || loadingImages.has(systemName) || failedImages.has(systemName)) {
      return;
    }

    setLoadingImages((prev) => new Set(prev).add(systemName));

    try {
      const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN || process.env.API_DOMAIN || '';
      const authToken = useAuthStore.getState().token;

      const response = await fetch(`${API_DOMAIN}/file/resource/${systemName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        setFailedImages((prev) => new Set(prev).add(systemName));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
        return;
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageUris((prev) => ({ ...prev, [serviceId]: dataUri }));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
      };
      reader.onerror = () => {
        setFailedImages((prev) => new Set(prev).add(systemName));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setFailedImages((prev) => new Set(prev).add(systemName));
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(systemName);
        return next;
      });
    }
  }, [imageUris, loadingImages, failedImages]);

  const fetchServices = useCallback(async () => {
    setIsLoadingServices(true);
    try {
      const response = await api.get<Service[]>('/en/on/services', {
        requiresAuth: true,
      });

      const servicesData = (response.data || []).filter((s) => !s.isDeleted).slice(0, 3);
      setServices(servicesData);

      // Pre-fetch images
      servicesData.forEach((service) => {
        if (service.thumbNail?.systemName) {
          getImageUri(service.thumbNail.systemName, service.id);
        }
      });
    } catch (err: any) {
      console.error('Failed to fetch services:', err);
      setServices([]);
    } finally {
      setIsLoadingServices(false);
    }
  }, [getImageUri]);

  const fetchRequestCounts = useCallback(async () => {
    if (!branch?.id) {
      setIncomingRequestsCount(0);
      setOngoingRequestsCount(0);
      return;
    }

    setIsLoadingRequests(true);
    try {
      const response = await api.get<IncomingRequest[]>(
        `/en/on/book/services/branch/${branch.id}`,
        {
          requiresAuth: true,
        }
      );

      const requests = response.data || [];

      // Incoming requests: not accepted, not cancelled, not declined, not completed, active
      const incoming = requests.filter(
        (req) =>
          !req.isAccepted &&
          !req.isCancelled &&
          !req.isDeclined &&
          !req.isCompleted &&
          req.isActive
      );

      // Ongoing requests: accepted, not completed, not cancelled, not declined, active
      const ongoing = requests.filter(
        (req) =>
          req.isAccepted &&
          !req.isCompleted &&
          !req.isCancelled &&
          !req.isDeclined &&
          req.isActive
      );

      setIncomingRequestsCount(incoming.length);
      setOngoingRequestsCount(ongoing.length);
    } catch (err: any) {
      console.error('Failed to fetch request counts:', err);
      setIncomingRequestsCount(0);
      setOngoingRequestsCount(0);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [branch?.id]);

  useEffect(() => {
    fetchServices();
    fetchLicense();
    fetchRequestCounts();
  }, [fetchServices, fetchRequestCounts]);

  const fetchLicense = useCallback(async () => {
    setIsLoadingLicense(true);
    try {
      // TODO: Replace with actual API endpoint when available
      // const response = await api.get('/en/on/license', { requiresAuth: true });
      // setLicense(response.data);
      
      // Dummy data
      setLicense({
        id: "f2ca78f8-ba8b-4836-98d0-dd5a32ef9c72",
        organizationId: "f52f10b3-bb98-493c-97a9-448338f38634",
        subscriptionId: "cfc8db2b-af94-4b6e-9d17-f9989a9306cb",
        totalSlots: 0,
        used_slots: 0,
        available_slots: 0,
        renewalDate: "2025-03-19T00:00:00+03:00",
        expiryDate: "2025-03-19T00:00:00+03:00",
        transactionId: "6f47c110-62b0-471c-84c4-00eb8140d765",
        staffId: "e507f638-2bd3-4df9-874b-bbf027ad47c0",
        subscription: {
          id: "cfc8db2b-af94-4b6e-9d17-f9989a9306cb",
          title: "Free Trial",
          subscriptionCode: "S001",
          noOfBranches: "Unlimited",
          members: "Unlimited",
          tadarVisibility: "Full",
          teamManagement: true,
          services: "Unlimited",
          assistanceSupport: "8 hrs",
          reports: true,
          noOfMonth: 2,
          isRenewed: true,
          price: 1,
          active: true,
          createdAt: 1742395618,
          updatedAt: 1742395618
        },
        isExpired: false,
        isInfinity: true,
        createdAt: 1742396752,
        updatedAt: 1742396752
      });
    } catch (err: any) {
      console.error('Failed to fetch license:', err);
      setLicense(null);
    } finally {
      setIsLoadingLicense(false);
    }
  }, []);

  const handleViewService = (serviceId: string) => {
    router.push({
      pathname: '/ServiceDetailsSummary',
      params: { serviceId },
    });
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

  const formatLicenseDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTimestampDate = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greetingText}>Hi, {getUserName()}</Text>
              <Text style={styles.greetingSubtext}>{getGreeting()}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7} onPress={() => router.push('/Notification')}>
            <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          </View>
          
        </View>

        {/* Requests Section */}
        <View style={styles.requestsSection}>
          <View style={styles.requestsGrid}>
            <View style={styles.requestCard}>
              <View style={styles.requestCardHeader}>
                <View style={[styles.requestIconContainer, { backgroundColor: colors.semantic.info + '20' }]}>
                  <Ionicons name="time-outline" size={24} color={colors.semantic.info} />
                </View>
                <Text style={styles.requestCardTitle}>Incoming </Text>
              </View>
              {isLoadingRequests ? (
                <ActivityIndicator size="small" color={colors.primary.green} style={{ marginVertical: 8 }} />
              ) : (
                <Text style={styles.requestCount}>{incomingRequestsCount}</Text>
              )}
              <Text style={styles.requestLabel}>Pending requests</Text>
              
            </View>

            <View style={styles.requestCard}>
              <View style={styles.requestCardHeader}>
                <View style={[styles.requestIconContainer, { backgroundColor: colors.primary.green + '20' }]}>
                  <Ionicons name="sync-outline" size={24} color={colors.primary.green} />
                </View>
                <Text style={styles.requestCardTitle}>Ongoing </Text>
              </View>
              {isLoadingRequests ? (
                <ActivityIndicator size="small" color={colors.primary.green} style={{ marginVertical: 8 }} />
              ) : (
                <Text style={styles.requestCount}>{ongoingRequestsCount}</Text>
              )}
              <Text style={styles.requestLabel}>Active requests</Text>
             
            </View>
          </View>
        </View>
        {/* License Section */}
        {license && (
          <View style={styles.licenseSection}>
            <ImageBackground
              source={require('@/assets/backgroud/license-background.png')}
              style={styles.licenseCard}
              resizeMode="cover"
            >
              <View style={styles.licenseContent}>
                <View style={styles.licenseHeader}>
                  <View style={styles.licenseIconContainer}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.text.inverse} />
                  </View>
                  <View style={styles.licenseHeaderText}>
                    <Text style={styles.licenseTitle}>Subscription</Text>
                    <Text style={styles.licenseSubtitle}>{license.subscription.title}</Text>
                  </View>
                  {license.isInfinity && (
                    <View style={styles.infinityBadge}>
                      <Ionicons name="infinite" size={16} color={colors.text.inverse} />
                      <Text style={styles.infinityBadgeText}>Unlimited</Text>
                    </View>
                  )}
                  {license.isExpired && (
                    <View style={styles.expiredBadge}>
                      <Ionicons name="alert-circle" size={16} color={colors.text.inverse} />
                      <Text style={styles.expiredBadgeText}>Expired</Text>
                    </View>
                  )}
                </View>

                <View style={styles.licenseDetails}>
                  <View style={styles.licenseDetailItem}>
                    <Ionicons name="calendar-outline" size={16} color={colors.text.inverse} />
                    <View style={styles.licenseDetailContent}>
                      <Text style={styles.licenseDetailLabel}>Date Purchased</Text>
                      <Text style={styles.licenseDetailValue}>
                        {formatTimestampDate(license.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.licenseDetailItem}>
                    <Ionicons
                      name={license.isInfinity ? 'infinite-outline' : 'time-outline'}
                      size={16}
                      color={colors.text.inverse}
                    />
                    <View style={styles.licenseDetailContent}>
                      <Text style={styles.licenseDetailLabel}>Date of Expiry</Text>
                      <Text style={styles.licenseDetailValue}>
                        {license.isInfinity
                          ? 'Never Expires'
                          : formatLicenseDate(license.expiryDate)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>
        )}


        {/* Incoming Requests orders Section */}
        <IncomingRequestsComponent />
        

        {/* Service Stats */}
        {company?.id && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Services Analysis</Text>
            <ServiceStats organizationId={company.id} />
          </View>
        )}

        {/* Subscription Plans Button */}
        <TouchableOpacity
          style={styles.subscriptionPlanButton}
          onPress={() => router.push('/SubscriptionPlans')}
          activeOpacity={0.7}
        >
          <View style={styles.subscriptionPlanContent}>
            <View style={styles.subscriptionPlanLeft}>
              <View style={styles.subscriptionPlanIconContainer}>
                <Ionicons name="card" size={24} color={colors.primary.green} />
              </View>
              <View style={styles.subscriptionPlanTextContainer}>
                <Text style={styles.subscriptionPlanTitle}>Subscription Plans</Text>
                <Text style={styles.subscriptionPlanSubtitle}>View and manage your plans</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary.white} />
          </View>
        </TouchableOpacity>
        {/* more action Section */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {actionCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.actionCard}
                activeOpacity={0.7}
                onPress={() => {
                  router.push(card.route as any);
                }}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: card.color + '15' }]}>
                  <Ionicons name={card.icon as any} size={28} color={card.color} />
                </View>
                <Text style={styles.actionCardTitle}>{card.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


       

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Services</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/Services')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {isLoadingServices ? (
            <View style={styles.servicesList}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.serviceCard}>
                  <Skeleton width="100%" height={120} borderRadius={12} />
                </View>
              ))}
            </View>
          ) : services.length === 0 ? (
            <View style={styles.emptyServices}>
              <Ionicons name="grid-outline" size={48} color={colors.neutral.gray.light} />
              <Text style={styles.emptyText}>No services available</Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleViewService(service.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.serviceImageContainer}>
                    {imageUris[service.id] ? (
                      <Image
                        source={{ uri: imageUris[service.id] }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.serviceImagePlaceholder}>
                        <Ionicons name="grid-outline" size={32} color={colors.neutral.gray.medium} />
                      </View>
                    )}
                  </View>
                  <View style={styles.serviceContent}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {service.name}
                    </Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                    <View style={styles.serviceFooter}>
                      <View style={styles.serviceModeBadge}>
                        <Ionicons name="folder-outline" size={12} color={colors.primary.green} />
                        <Text style={styles.serviceModeText}>{service.mode.name}</Text>
                      </View>
                      {!service.isPublic && (
                        <View style={styles.privateBadge}>
                          <Ionicons name="lock-closed" size={12} color={colors.neutral.gray.dark} />
                          <Text style={styles.privateBadgeText}>Private</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  headerTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 2,
  },
  greetingSubtext: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 6,
    backgroundColor: colors.semantic.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  licenseSection: {
    marginBottom: 24,
  },
  licenseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  licenseContent: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  licenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  licenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  licenseHeaderText: {
    flex: 1,
  },
  licenseTitle: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: 2,
  },
  licenseSubtitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  infinityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.green + 'CC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  infinityBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.error + 'CC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  expiredBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  licenseDetails: {
    gap: 16,
  },
  licenseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  licenseDetailContent: {
    flex: 1,
  },
  licenseDetailLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.8,
    marginBottom: 4,
  },
  licenseDetailValue: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  statsSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  servicesSection: {
    marginBottom: 24,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  serviceImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background.secondary,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  serviceContent: {
    padding: 12,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 8,
    lineHeight: 18,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.greenLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  serviceModeText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.gray.lighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  privateBadgeText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.dark,
  },
  emptyServices: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginTop: 8,
  },
  requestsSection: {
    marginBottom: 24,
  },
  requestsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  requestCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  requestIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCardTitle: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    flex: 1,
  },
  requestCount: {
    fontSize: 32,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  requestLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 12,
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '33%',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40 ,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subscriptionPlanButton: {
    backgroundColor: colors.background.darkAccent,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
   
  },
  subscriptionPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  subscriptionPlanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  subscriptionPlanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionPlanTextContainer: {
    flex: 1,
  },
  subscriptionPlanTitle: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  subscriptionPlanSubtitle: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
  },
});
