import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ServiceStats {
  organizationId: string;
  organizationName: string;
  totalServices: number;
  totalPublicServices: number;
  totalDraftServices: number;
  totalDeletedServices: number;
}

interface ServiceStatsProps {
  organizationId: string;
}

const ServiceStats: React.FC<ServiceStatsProps> = ({ organizationId }) => {
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<ServiceStats>(
        `/en/on/organization/${organizationId}/service/stats`,
        {
          requiresAuth: true,
        }
      );

      setStats(response.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load service stats');
      setStats({
        organizationId,
        organizationName: '',
        totalServices: 0,
        totalPublicServices: 0,
        totalDraftServices: 0,
        totalDeletedServices: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary.green} />
      </View>
    );
  }

  const displayStats = stats || {
    organizationId,
    organizationName: '',
    totalServices: 0,
    totalPublicServices: 0,
    totalDraftServices: 0,
    totalDeletedServices: 0,
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary.greenLight + '20' }]}>
            <Ionicons name="grid-outline" size={20} color={colors.primary.green} />
          </View>
          <Text style={styles.statValue}>{displayStats.totalServices}</Text>
          <Text style={styles.statLabel}>Total Services</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.semantic.info + '20' }]}>
            <Ionicons name="globe-outline" size={20} color={colors.semantic.info} />
          </View>
          <Text style={styles.statValue}>{displayStats.totalPublicServices}</Text>
          <Text style={styles.statLabel}>Public</Text>
        </View>
      </View>
    </View>
  );
};

export default ServiceStats;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
});

