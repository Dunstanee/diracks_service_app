import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface RevenueBreakdown {
    organizationId: string;
    organizationName: string;
    branchId: string;
    branchName: string;
    serviceId: string;
    serviceName: string;
    customerId: string;
    customerFirstName: string;
    customerLastName: string;
    totalInvoices: number;
    totalRevenue: number;
    averageRevenuePerInvoice: number;
}

type GroupByType = 'service' | 'branch' | 'customer' | 'all';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64; // Padding on both sides

const FinanceBreakSummary = () => {
    const [revenue, setRevenue] = useState<RevenueBreakdown[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [groupBy, setGroupBy] = useState<GroupByType>('all');

    const fetchRevenue = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<RevenueBreakdown[]>('/en/on/revenue/breakdown', {
                requiresAuth: true,
            });

            setRevenue(response.data || []);
        } catch (err: any) {
            setError(err?.message || 'Failed to load revenue breakdown');
            setRevenue([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRevenue();
    }, [fetchRevenue]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);

        try {
            const response = await api.get<RevenueBreakdown[]>('/en/on/revenue/breakdown', {
                requiresAuth: true,
            });

            setRevenue(response.data || []);
        } catch (err: any) {
            setError(err?.message || 'Failed to refresh revenue breakdown');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Calculate totals
    const totalRevenue = revenue.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalInvoices = revenue.reduce((sum, item) => sum + item.totalInvoices, 0);
    const averageRevenue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Group data by selected type
    const getGroupedData = () => {
        if (groupBy === 'all') return revenue;

        const grouped = new Map<string, RevenueBreakdown>();

        revenue.forEach((item) => {
            let key = '';
            if (groupBy === 'service') {
                key = `${item.serviceId}-${item.serviceName}`;
            } else if (groupBy === 'branch') {
                key = `${item.branchId}-${item.branchName}`;
            } else if (groupBy === 'customer') {
                key = `${item.customerId}-${item.customerFirstName} ${item.customerLastName}`;
            }

            if (grouped.has(key)) {
                const existing = grouped.get(key)!;
                existing.totalRevenue += item.totalRevenue;
                existing.totalInvoices += item.totalInvoices;
                existing.averageRevenuePerInvoice =
                    existing.totalRevenue / existing.totalInvoices;
            } else {
                grouped.set(key, { ...item });
            }
        });

        return Array.from(grouped.values());
    };

    const groupedData = getGroupedData();
    const maxRevenue = Math.max(...groupedData.map((item) => item.totalRevenue), 1);

    // Render bar chart
    const renderBarChart = () => {
        const sortedData = [...groupedData].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Revenue Breakdown</Text>
                <View style={styles.chart}>
                    {sortedData.map((item, index) => {
                        const barWidth = (item.totalRevenue / maxRevenue) * CHART_WIDTH;
                        const label =
                            groupBy === 'service'
                                ? item.serviceName
                                : groupBy === 'branch'
                                    ? item.branchName
                                    : groupBy === 'customer'
                                        ? `${item.customerFirstName} ${item.customerLastName}`
                                        : `${item.serviceName} - ${item.branchName}`;

                        return (
                            <View key={index} style={styles.barItem}>
                                <View style={styles.barLabelContainer}>
                                    <Text style={styles.barLabel} numberOfLines={1}>
                                        {label}
                                    </Text>
                                    <Text style={styles.barValue}>KES {item.totalRevenue.toLocaleString()}</Text>
                                </View>
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                width: barWidth,
                                                backgroundColor:
                                                    index % 3 === 0
                                                        ? colors.primary.green
                                                        : index % 3 === 1
                                                            ? colors.secondary.orange
                                                            : colors.semantic.info,
                                            },
                                        ]}
                                    />
                                </View>
                                <View style={styles.barDetails}>
                                    <Text style={styles.barDetailText}>
                                        {item.totalInvoices} invoice{item.totalInvoices !== 1 ? 's' : ''}
                                    </Text>
                                    <Text style={styles.barDetailText}>
                                        Avg: KES {item.averageRevenuePerInvoice.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Finance Summary</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.green} />
                    <Text style={styles.loadingText}>Loading finance data...</Text>
                </View>
            </View>
        );
    }

    if (error || revenue.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Finance Summary</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="cash-outline" size={64} color={colors.neutral.gray.light} />
                    <Text style={styles.emptyText}>
                        {error || 'No revenue data available'}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchRevenue}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Finance Summary</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary.green]}
                        tintColor={colors.primary.green}
                    />
                }
            >
                {/* Summary Cards */}
                <View style={styles.summarySection}>
                    <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
                        <View style={styles.summaryIconContainer}>
                            <Ionicons name="cash" size={32} color={colors.text.inverse} />
                        </View>
                        <Text style={styles.summaryLabel}>Total Revenue</Text>
                        <Text style={styles.summaryValue}>KES {totalRevenue.toLocaleString()}</Text>
                    </View>

                    <View style={styles.summaryCardsRow}>
                        <View style={[styles.summaryCard, styles.summaryCardSecondary]}>
                            <Ionicons name="receipt" size={24} color={colors.primary.green} />
                            <Text style={styles.summaryCardLabel}>Total Invoices</Text>
                            <Text style={styles.summaryCardValue}>{totalInvoices}</Text>
                        </View>

                        <View style={[styles.summaryCard, styles.summaryCardSecondary]}>
                            <Ionicons name="trending-up" size={24} color={colors.secondary.orange} />
                            <Text style={styles.summaryCardLabel}>Avg per Invoice</Text>
                            <Text style={styles.summaryCardValue}>KES {averageRevenue.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Group By Filter */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Group By:</Text>
                    <View style={styles.filterButtons}>
                        {(['all', 'service', 'branch', 'customer'] as GroupByType[]).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.filterButton,
                                    groupBy === type && styles.filterButtonActive,
                                ]}
                                onPress={() => setGroupBy(type)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.filterButtonText,
                                        groupBy === type && styles.filterButtonTextActive,
                                    ]}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Bar Chart */}
                {renderBarChart()}

                {/* Detailed List */}
                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
                    {groupedData.map((item, index) => (
                        <View key={index} style={styles.detailCard}>
                            <View style={styles.detailHeader}>
                                <View style={styles.detailIconContainer}>
                                    <Ionicons name="business" size={20} color={colors.primary.green} />
                                </View>
                                <View style={styles.detailInfo}>
                                    <Text style={styles.detailServiceName}>{item.serviceName}</Text>
                                    <Text style={styles.detailBranchName}>{item.branchName}</Text>
                                    <Text style={styles.detailCustomerName}>
                                        {item.customerFirstName} {item.customerLastName}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailStats}>
                                <View style={styles.detailStatItem}>
                                    <Text style={styles.detailStatLabel}>Revenue</Text>
                                    <Text style={styles.detailStatValue}>
                                        KES {item.totalRevenue.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.detailStatItem}>
                                    <Text style={styles.detailStatLabel}>Invoices</Text>
                                    <Text style={styles.detailStatValue}>{item.totalInvoices}</Text>
                                </View>
                                <View style={styles.detailStatItem}>
                                    <Text style={styles.detailStatLabel}>Average</Text>
                                    <Text style={styles.detailStatValue}>
                                        KES {item.averageRevenuePerInvoice.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default FinanceBreakSummary;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray.lighter,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: fonts.weights.bold,
        color: colors.text.primary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: fonts.weights.regular,
        color: colors.text.secondary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: fonts.weights.medium,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary.green,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        fontSize: 14,
        fontFamily: fonts.weights.semiBold,
        color: colors.text.inverse,
    },
    summarySection: {
        marginBottom: 24,
        gap: 12,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryCardPrimary: {
        backgroundColor: colors.primary.green,
    },
    summaryCardSecondary: {
        flex: 1,
        backgroundColor: colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    summaryCardsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryIconContainer: {
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        fontFamily: fonts.weights.medium,
        color: colors.text.inverse,
        opacity: 0.9,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 28,
        fontFamily: fonts.weights.bold,
        color: colors.text.inverse,
    },
    summaryCardLabel: {
        fontSize: 12,
        fontFamily: fonts.weights.medium,
        color: colors.text.secondary,
    },
    summaryCardValue: {
        fontSize: 18,
        fontFamily: fonts.weights.bold,
        color: colors.text.primary,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 14,
        fontFamily: fonts.weights.semiBold,
        color: colors.text.primary,
        marginBottom: 12,
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.background.primary,
        borderWidth: 1,
        borderColor: colors.neutral.gray.lighter,
    },
    filterButtonActive: {
        backgroundColor: colors.primary.green,
        borderColor: colors.primary.green,
    },
    filterButtonText: {
        fontSize: 13,
        fontFamily: fonts.weights.medium,
        color: colors.text.primary,
    },
    filterButtonTextActive: {
        color: colors.text.inverse,
    },
    chartContainer: {
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chartTitle: {
        fontSize: 18,
        fontFamily: fonts.weights.bold,
        color: colors.text.primary,
        marginBottom: 20,
    },
    chart: {
        gap: 16,
    },
    barItem: {
        marginBottom: 12,
    },
    barLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    barLabel: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.weights.semiBold,
        color: colors.text.primary,
    },
    barValue: {
        fontSize: 13,
        fontFamily: fonts.weights.bold,
        color: colors.primary.green,
    },
    barWrapper: {
        height: 24,
        backgroundColor: colors.neutral.gray.lightest,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 4,
    },
    bar: {
        height: '100%',
        borderRadius: 12,
    },
    barDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    barDetailText: {
        fontSize: 11,
        fontFamily: fonts.weights.regular,
        color: colors.text.secondary,
    },
    detailsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: fonts.weights.bold,
        color: colors.text.primary,
        marginBottom: 16,
    },
    detailCard: {
        backgroundColor: colors.background.primary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary.greenLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailInfo: {
        flex: 1,
        gap: 4,
    },
    detailServiceName: {
        fontSize: 16,
        fontFamily: fonts.weights.bold,
        color: colors.text.primary,
    },
    detailBranchName: {
        fontSize: 13,
        fontFamily: fonts.weights.medium,
        color: colors.text.secondary,
    },
    detailCustomerName: {
        fontSize: 12,
        fontFamily: fonts.weights.regular,
        color: colors.neutral.gray.medium,
    },
    detailStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.neutral.gray.lighter,
    },
    detailStatItem: {
        alignItems: 'center',
        gap: 4,
    },
    detailStatLabel: {
        fontSize: 11,
        fontFamily: fonts.weights.medium,
        color: colors.text.secondary,
    },
    detailStatValue: {
        fontSize: 14,
        fontFamily: fonts.weights.bold,
        color: colors.text.primary,
    },
});
