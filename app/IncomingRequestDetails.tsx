import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import IncomingRequestActivitiesTab from './components/IncomingRequestActivitiesTab';
import IncomingRequestDetailsTab from './components/IncomingRequestDetailsTab';
import IncomingRequestInvoicesTab from './components/IncomingRequestInvoicesTab';
import IncomingRequestSharedFilesTab from './components/IncomingRequestSharedFilesTab';
import IncomingRequestVehicleProfileTab from './components/IncomingRequestVehicleProfileTab';

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

interface ServiceMode {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

interface RequestDetails {
    id: string;
    bookCode: string;
    description: string;
    organizationId: string;
    branchId: string;
    customerId: string;
    staffId: string | null;
    serviceId: string;
    priceId: string | null;
    bookedDate: number;
    acceptedDate: number | null;
    isAccepted: boolean;
    isActive: boolean;
    isHomeWorkRequest: boolean;
    isCancelled: boolean;
    isDeclined: boolean;
    isCompleted: boolean;
    completedDate: number | null;
    service: {
        id: string;
        organizationId: string;
        name: string;
        description: string;
        isPublic: boolean;
        isDeleted: boolean;
        modeId: number;
        staffId: string;
        thumbNailId: string;
        thumbNail: ThumbNail | null;
        mode: ServiceMode;
        createdAt: number;
        updatedAt: number;
    };
    branch: {
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
    };
    customer: {
        id: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: number;
        country: string;
        userNumber: string;
        gender: number;
        birthDate: string;
        verified: boolean;
        active: boolean;
        createdAt: number;
        updatedAt: number;
    };
    createdAt: number;
    updatedAt: number;
}

type TabType = 'details' | 'sharedFiles' | 'invoices' | 'vehicleProfile' | 'activities';

const IncomingRequestDetails = () => {
    const { requestId } = useLocalSearchParams<{ requestId: string }>();
    const [request, setRequest] = useState<RequestDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false,
    });
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, visible: true });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, visible: false }));
    };

    const getImageUri = useCallback(async (systemName: string): Promise<void> => {
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
                return;
            }

            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUri = reader.result as string;
                setImageUri(dataUri);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
        }
    }, []);

    const fetchRequestDetails = useCallback(async () => {
        if (!requestId) {
            setError('Request ID is required');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<RequestDetails>(
                `/en/on/book/service/request/${requestId}`,
                {
                    requiresAuth: true,
                }
            );

            setRequest(response.data);

            // Load thumbnail image if available
            if (response.data.service.thumbNail?.systemName) {
                getImageUri(response.data.service.thumbNail.systemName);
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to load request details. Please try again.');
            showToast(err?.message || 'Failed to load request details. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [requestId, getImageUri]);

    useEffect(() => {
        fetchRequestDetails();
    }, [fetchRequestDetails]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.green} />
                <Text style={styles.loadingText}>Loading request details...</Text>
            </View>
        );
    }

    if (error || !request) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
                <Text style={styles.errorText}>{error || 'Request not found'}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchRequestDetails}
                    activeOpacity={0.7}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const backgroundImage = imageUri
        ? { uri: imageUri }
        : require('@/assets/backgroud/incoming-background.png');

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (event: any) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                // Automatically minimize when content fades out (around 25px scroll)
                setIsScrolled(offsetY > 30);
            },
        }
    );

    // Smooth transition: fade content first, then minimize header
    // This prevents shaking by completing the fade before minimizing
    const bannerHeight = scrollY.interpolate({
        inputRange: [0, 10, 30],
        outputRange: [300, 300, 80],
        extrapolate: 'clamp',
    });

    const tabsTop = scrollY.interpolate({
        inputRange: [0, 10, 30],
        outputRange: [300, 300, 80],
        extrapolate: 'clamp',
    });

    // Fade content out completely by 25px, then header minimizes smoothly
    const bannerContentOpacity = scrollY.interpolate({
        inputRange: [0, 10, 30],
        outputRange: [1, 0, 0],
        extrapolate: 'clamp',
    });


    const openToast = (message: string, type: ToastType = 'info') => {
        showToast(message, type);
    };
   

    const renderTabs = (containerStyle: any) => (
        <View style={containerStyle}>
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
                        name="information-circle-outline"
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
                    style={[styles.tab, activeTab === 'sharedFiles' && styles.tabActive]}
                    onPress={() => setActiveTab('sharedFiles')}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="folder-outline"
                        size={18}
                        color={activeTab === 'sharedFiles' ? colors.primary.green : colors.neutral.gray.medium}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'sharedFiles' && styles.tabTextActive,
                        ]}
                    >
                        Shared Files
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'invoices' && styles.tabActive]}
                    onPress={() => setActiveTab('invoices')}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="receipt-outline"
                        size={18}
                        color={activeTab === 'invoices' ? colors.primary.green : colors.neutral.gray.medium}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'invoices' && styles.tabTextActive,
                        ]}
                    >
                        Invoices
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'vehicleProfile' && styles.tabActive]}
                    onPress={() => setActiveTab('vehicleProfile')}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="car-outline"
                        size={18}
                        color={activeTab === 'vehicleProfile' ? colors.primary.green : colors.neutral.gray.medium}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'vehicleProfile' && styles.tabTextActive,
                        ]}
                    >
                        Vehicle Profile
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'activities' && styles.tabActive]}
                    onPress={() => setActiveTab('activities')}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="time-outline"
                        size={18}
                        color={activeTab === 'activities' ? colors.primary.green : colors.neutral.gray.medium}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'activities' && styles.tabTextActive,
                        ]}
                    >
                        Activities
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const headerAndTabsHeight = scrollY.interpolate({
        inputRange: [0, 10, 30],
        outputRange: [380, 280, 140], // 300 (banner) + 80 (tabs) when expanded, 80 (banner) + 60 (tabs) when minimized
        extrapolate: 'clamp',
    });

    return (
        <>
            <View style={styles.container}>
                {/* Fixed Sticky Header - Always visible, minimized when scrolled */}
                <Animated.View style={[styles.stickyHeaderContainer, { height: bannerHeight }]}>
                    <ImageBackground
                        source={backgroundImage}
                        style={styles.stickyBanner}
                        resizeMode="cover"
                    >
                        <View style={styles.stickyBannerOverlay}>
                            {/* Always show back button and service name */}
                            <View style={styles.stickyHeaderContent}>
                                <TouchableOpacity
                                    style={styles.stickyBackButton}
                                    onPress={() => router.back()}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="arrow-back" size={20} color={colors.text.inverse} />
                                </TouchableOpacity>
                                <Text style={styles.stickyServiceName} numberOfLines={1}>
                                    {request.service.name}
                                </Text>
                            </View>

                            {/* Show full content when not scrolled */}
                            <Animated.View 
                                style={[
                                    styles.stickyBannerFullContent,
                                    { opacity: bannerContentOpacity }
                                ]}
                                pointerEvents={isScrolled ? 'none' : 'auto'}
                            >
                                <View style={styles.statusBadgeContainer}>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            request.isAccepted && !request.isCompleted
                                                ? styles.statusBadgeOngoing
                                                : request.isCompleted
                                                    ? styles.statusBadgeCompleted
                                                    : styles.statusBadgeNew,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusBadgeText,
                                                request.isAccepted && !request.isCompleted
                                                    ? styles.statusBadgeTextOngoing
                                                    : request.isCompleted
                                                        ? styles.statusBadgeTextCompleted
                                                        : styles.statusBadgeTextNew,
                                            ]}
                                        >
                                            {request.isAccepted && !request.isCompleted ? 'Ongoing' : request.isCompleted ? 'Completed' : 'New'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.bannerInfo}>
                                    <Text style={styles.serviceName}>{request.service.name}</Text>
                                    <Text style={styles.customerName}>
                                        {request.customer.firstName} {request.customer.lastName}
                                    </Text>
                                    <View style={styles.bannerMeta}>
                                        <View style={styles.bannerMetaItem}>
                                            <Ionicons name="time-outline" size={14} color={colors.text.inverse} />
                                            <Text style={styles.bannerMetaText}>
                                                {formatDateTime(request.bookedDate)}
                                            </Text>
                                        </View>
                                        <View style={styles.bannerMetaItem}>
                                            <Ionicons name="location-outline" size={14} color={colors.text.inverse} />
                                            <Text style={styles.bannerMetaText}>{request.branch.name}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        </View>
                    </ImageBackground>
                </Animated.View>

                {/* Fixed Sticky Tabs - Always visible */}
                <Animated.View style={[styles.tabsContainerSticky, { top: bannerHeight }]}>
                    {renderTabs(styles.tabsContainerInner)}
                </Animated.View>

                {/* Scrollable Content */}
                <Animated.ScrollView 
                    style={styles.scrollView} 
                    contentContainerStyle={[styles.scrollViewContent, { minHeight: '100%' }]}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={1}
                    bounces={true}
                    alwaysBounceVertical={true}
                >
                    {/* Spacer to account for fixed header and tabs */}
                    <Animated.View style={{ height: headerAndTabsHeight }} />

                    {/* Tab Content */}
                    <View style={styles.tabContent}>
                        {activeTab === 'details' && <IncomingRequestDetailsTab request={request} onToast={openToast} onRefresh={fetchRequestDetails} />}
                        {activeTab === 'sharedFiles' && <IncomingRequestSharedFilesTab bookedServiceId={request.id} isCompleted={request.isCompleted} />}
                        {activeTab === 'invoices' && <IncomingRequestInvoicesTab bookedServiceId={request.id} onToast={openToast} isCompleted={request.isCompleted} />}
                        {activeTab === 'vehicleProfile' && <IncomingRequestVehicleProfileTab bookedServiceId={request.id} isCompleted={request.isCompleted} />}
                        {activeTab === 'activities' && <IncomingRequestActivitiesTab bookedServiceId={request.id} isCompleted={request.isCompleted} />}
                    </View>
                    
                    {/* Extra padding at bottom to ensure scrollable space even with small content */}
                    <View style={{ height: 200 }} />
                </Animated.ScrollView>
            </View>
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideToast}
            />
        </>
    );
};

export default IncomingRequestDetails;

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
        fontSize: 16,
        fontFamily: fonts.weights.regular,
        color: colors.neutral.gray.medium,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: colors.background.primary,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: fonts.weights.regular,
        color: colors.semantic.error,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 24,
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
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.neutral.gray.lighter + '30',
        borderRadius: 20,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: fonts.weights.bold,
        color: colors.text.inverse,
    },
    headerSubtitle: {
        fontSize: 12,
        fontFamily: fonts.weights.regular,
        color: colors.text.inverse,
        opacity: 0.8,
        marginTop: 2,
    },
    placeholder: {
        width: 40,
    },
    bannerContainer: {
        height: 300,
        overflow: 'hidden',
    },
    banner: {
        flex: 1,
        width: '100%',
    },
    bannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'space-between',
        padding: 20,
    },
    bannerContent: {
        gap: 12,
    },
    statusBadgeContainer: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusBadgeNew: {
        backgroundColor: colors.semantic.info + 'CC',
    },
    statusBadgeOngoing: {
        backgroundColor: colors.secondary.orange + 'CC',
    },
    statusBadgeCompleted: {
        backgroundColor: colors.primary.green + 'CC',
    },
    statusBadgeTextCompleted: {
        color: colors.text.inverse,
    },
    statusBadgeText: {
        fontSize: 12,
        fontFamily: fonts.weights.semiBold,
        color: colors.text.inverse,
    },
    statusBadgeTextNew: {
        color: colors.text.inverse,
    },
    statusBadgeTextOngoing: {
        color: colors.text.inverse,
    },
    bannerInfo: {
        gap: 12,
        marginTop: 8,
    },
    serviceName: {
        fontSize: 24,
        fontFamily: fonts.weights.bold,
        color: colors.text.inverse,
        marginBottom: 4,
    },
    customerName: {
        fontSize: 16,
        fontFamily: fonts.weights.semiBold,
        color: colors.text.inverse,
        opacity: 0.9,
        marginBottom: 4,
    },
    bannerMeta: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    bannerMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bannerMetaText: {
        fontSize: 12,
        fontFamily: fonts.weights.regular,
        color: colors.text.inverse,
        opacity: 0.8,
    },
    tabsContainer: {
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray.lighter,
    },
    tabsContainerSticky: {
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray.lighter,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabsContainerInner: {
        backgroundColor: 'transparent',
    },
    tabsScrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.background.secondary,
        marginRight: 8,
    },
    tabActive: {
        backgroundColor: colors.primary.greenLight + '20',
    },
    tabText: {
        fontSize: 14,
        fontFamily: fonts.weights.medium,
        color: colors.neutral.gray.medium,
    },
    tabTextActive: {
        color: colors.primary.green,
        fontFamily: fonts.weights.semiBold,
    },
    tabContent: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    stickyHeaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    stickyBanner: {
        flex: 1,
        width: '100%',
    },
    stickyBannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 20,
        paddingTop: 20,
        justifyContent: 'flex-start',
    },
    stickyHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    stickyBackButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.neutral.gray.lighter + '40',
        borderRadius: 18,
    },
    stickyServiceName: {
        flex: 1,
        fontSize: 16,
        fontFamily: fonts.weights.bold,
        color: colors.text.inverse,
    },
    stickyBannerFullContent: {
        flex: 1,
        justifyContent: 'flex-start',
        gap: 20,
    },
});
