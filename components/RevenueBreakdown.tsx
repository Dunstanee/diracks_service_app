import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

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

const RevenueBreakdown: React.FC = () => {
  const [revenue, setRevenue] = useState<RevenueBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary.green} />
      </View>
    );
  }

  if (error || revenue.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Ionicons name="cash-outline" size={32} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>No revenue data available</Text>
        </View>
      </View>
    );
  }

  const totalRevenue = revenue.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalInvoices = revenue.reduce((sum, item) => sum + item.totalInvoices, 0);

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
          <Text style={styles.summaryValue}>${totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Invoices</Text>
          <Text style={styles.summaryValue}>{totalInvoices}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {revenue.map((item, index) => (
          <View key={index} style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <View style={styles.revenueIconContainer}>
                <Ionicons name="cash" size={20} color={colors.primary.green} />
              </View>
              <View style={styles.revenueInfo}>
                <Text style={styles.revenueServiceName} numberOfLines={1}>
                  {item.serviceName}
                </Text>
                <Text style={styles.revenueBranchName} numberOfLines={1}>
                  {item.branchName}
                </Text>
              </View>
            </View>
            <View style={styles.revenueDetails}>
              <View style={styles.revenueDetailItem}>
                <Text style={styles.revenueDetailLabel}>Customer</Text>
                <Text style={styles.revenueDetailValue} numberOfLines={1}>
                  {item.customerFirstName} {item.customerLastName}
                </Text>
              </View>
              <View style={styles.revenueDetailItem}>
                <Text style={styles.revenueDetailLabel}>Invoices</Text>
                <Text style={styles.revenueDetailValue}>{item.totalInvoices}</Text>
              </View>
              <View style={styles.revenueDetailItem}>
                <Text style={styles.revenueDetailLabel}>Revenue</Text>
                <Text style={styles.revenueDetailValue}>${item.totalRevenue.toLocaleString()}</Text>
              </View>
              <View style={styles.revenueDetailItem}>
                <Text style={styles.revenueDetailLabel}>Avg/Invoice</Text>
                <Text style={styles.revenueDetailValue}>
                  ${item.averageRevenuePerInvoice.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default RevenueBreakdown;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
  },
  scrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  revenueCard: {
    width: 280,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  revenueIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueInfo: {
    flex: 1,
  },
  revenueServiceName: {
    fontSize: 14,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  revenueBranchName: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  revenueDetails: {
    gap: 8,
  },
  revenueDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueDetailLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  revenueDetailValue: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  emptyCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginTop: 8,
  },
});

