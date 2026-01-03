import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SubscriptionPlan {
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
}

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<SubscriptionPlan[]>('/en/on/subscription/plans', {
        requiresAuth: true,
      });
      setPlans(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load subscription plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const formatPrice = (price?: number): string => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // TODO: Navigate to purchase/payment screen or handle plan selection
    console.log('Selected plan:', plan);
    // router.push({
    //   pathname: '/PurchasePlan',
    //   params: { planId: plan.id },
    // });
  };

  const renderSkeletonPlans = () => {
    return (
      <View style={styles.plansContainer}>
        {Array.from({ length: 2 }).map((_, index) => (
          <View key={index} style={styles.skeletonCardWrapper}>
            <View style={styles.skeletonCard}>
              {/* Plan Header Skeleton */}
              <View style={styles.planHeader}>
                <View style={styles.planHeaderLeft}>
                  <Skeleton width="60%" height={32} borderRadius={8} style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height={16} borderRadius={6} />
                </View>
                <View style={styles.priceContainer}>
                  <Skeleton width={100} height={36} borderRadius={8} />
                  <Skeleton width={80} height={14} borderRadius={6} style={{ marginTop: 4 }} />
                </View>
              </View>

              {/* Features Skeleton */}
              <View style={styles.featuresContainer}>
                {Array.from({ length: 8 }).map((_, featureIndex) => (
                  <View key={featureIndex} style={styles.featureRow}>
                    <Skeleton width={18} height={18} borderRadius={9} />
                    <Skeleton width="80%" height={16} borderRadius={6} />
                  </View>
                ))}
              </View>

              {/* Button Skeleton */}
              <Skeleton width="100%" height={52} borderRadius={12} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlans} activeOpacity={0.7}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={styles.backButton} />
      </View>

      {/* Plans List */}
      {isLoading ? (
        renderSkeletonPlans()
      ) : plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>No subscription plans available</Text>
        </View>
      ) : (
        <View style={styles.plansContainer}>
          {plans && plans.length > 0 && plans.map((plan) => (
            <View key={plan.id} style={styles.planCardWrapper}>
              <ImageBackground
                source={require('@/assets/backgroud/plan-background.jpg')}
                style={styles.planCard}
                resizeMode="cover"
              >
                <View style={styles.planOverlay}>
                  {/* Plan Header */}
                  <View style={styles.planHeader}>
                    <View style={styles.planHeaderLeft}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planCode}>{plan.subscriptionCode}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceAmount}>{formatPrice(plan.price)}</Text>
                      <Text style={styles.pricePeriod}>/{plan.noOfMonth} month{plan.noOfMonth !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>

                  {/* Plan Features */}
                  <View style={styles.featuresContainer}>
                    <View style={styles.featureRow}>
                      <Ionicons name="business-outline" size={18} color={colors.text.inverse} />
                      <Text style={styles.featureText}>
                        <Text style={styles.featureLabel}>Branches: </Text>
                        {plan.noOfBranches}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <Ionicons name="people-outline" size={18} color={colors.text.inverse} />
                      <Text style={styles.featureText}>
                        <Text style={styles.featureLabel}>Members: </Text>
                        {plan.members}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <Ionicons name="grid-outline" size={18} color={colors.text.inverse} />
                      <Text style={styles.featureText}>
                        <Text style={styles.featureLabel}>Services: </Text>
                        {plan.services}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <Ionicons name="eye-outline" size={18} color={colors.text.inverse} />
                      <Text style={styles.featureText}>
                        <Text style={styles.featureLabel}>Tadar Visibility: </Text>
                        {plan.tadarVisibility}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <Ionicons name="time-outline" size={18} color={colors.text.inverse} />
                      <Text style={styles.featureText}>
                        <Text style={styles.featureLabel}>Support: </Text>
                        {plan.assistanceSupport}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <Ionicons
                        name={plan.teamManagement ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={colors.text.inverse}
                      />
                      <Text style={styles.featureText}>
                        <Text style={styles.featureLabel}>Team Management: </Text>
                        {plan.teamManagement ? 'Yes' : 'No'}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <Ionicons
                        name={plan.reports ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={colors.text.inverse}
                      />
                      <Text style={styles.featureText}>
                        <Text style={styles.featureLabel}>Reports: </Text>
                        {plan.reports ? 'Yes' : 'No'}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <Ionicons
                        name={plan.isRenewed ? 'refresh-circle' : 'time-outline'}
                        size={18}
                        color={colors.text.inverse}
                      />
                      <Text style={styles.featureText}>
                        <Text style={styles.featureLabel}>Auto Renewal: </Text>
                        {plan?.isRenewed ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </View>

                  {/* Select Button */}
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => handleSelectPlan(plan)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectButtonText}>Select Plan</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default SubscriptionPlans;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingBottom: 40,
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
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  planCardWrapper: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  skeletonCardWrapper: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  skeletonCard: {
    backgroundColor: colors.background.primary,
    padding: 24,
    minHeight: 400,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  planCard: {
    width: '100%',
    minHeight: 400,
  },
  planOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 24,
    justifyContent: 'space-between',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  planHeaderLeft: {
    flex: 1,
  },
  planTitle: {
    fontSize: 28,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  planCode: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 32,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    lineHeight: 36,
  },
  pricePeriod: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.9,
    marginTop: 2,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    flex: 1,
  },
  featureLabel: {
    fontFamily: fonts.weights.semiBold,
    opacity: 0.9,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.green,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
});
