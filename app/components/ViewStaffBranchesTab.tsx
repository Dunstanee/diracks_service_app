import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Branch {
  id: string;
  organizationId: string;
  name: string;
  longitude: number;
  latitude: number;
  contact: number;
  description: string;
  email: string;
  stateProvince: string;
  city: string;
  location: string;
  createdAt: number;
  updatedAt: number;
}

interface StaffBranch {
  id: string;
  organizationId: string;
  branch_id: string;
  userId: string;
  isLocked: boolean;
  branch: Branch;
  createdAt: number;
  updatedAt: number;
}

interface ViewStaffBranchesTabProps {
  organizationStaffId: string;
}

const ViewStaffBranchesTab: React.FC<ViewStaffBranchesTabProps> = ({ organizationStaffId }) => {
  const [branches, setBranches] = useState<StaffBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    if (!organizationStaffId) {
      setError('Staff ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<StaffBranch[]>(
        `/en/on/staff/${organizationStaffId}/branches`,
        {
          requiresAuth: true,
        }
      );

      setBranches(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff branches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationStaffId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // const handleViewBranch = (branchId: string) => {
  //   router.push({
  //     pathname: '/BranchDetails',
  //     params: { branchId },
  //   });
  // };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading branches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBranches} activeOpacity={0.7}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (branches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="business-outline" size={64} color={colors.neutral.gray.light} />
        <Text style={styles.emptyText}>No branches assigned</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {branches.map((staffBranch) => {
        const branch = staffBranch.branch;
        return (
          <TouchableOpacity
            key={staffBranch.id}
            style={styles.branchCard}
            // onPress={() => handleViewBranch(branch.id)}
            activeOpacity={0.7}
          >
            <View style={styles.branchCardContent}>
              <View style={styles.branchHeader}>
                <View style={styles.branchIconContainer}>
                  <Ionicons name="business" size={24} color={colors.primary.green} />
                </View>
                <View style={styles.branchInfo}>
                  <Text style={styles.branchName} numberOfLines={1}>
                    {branch.name}
                  </Text>
                  <Text style={styles.branchLocation} numberOfLines={1}>
                    {branch.city}, {branch.stateProvince}
                  </Text>
                </View>
                {staffBranch.isLocked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={16} color={colors.semantic.error} />
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                )}
              </View>

              <View style={styles.branchDetails}>
                <View style={styles.branchDetailRow}>
                  <Ionicons name="mail-outline" size={14} color={colors.neutral.gray.medium} />
                  <Text style={styles.branchDetailText} numberOfLines={1}>
                    {branch.email}
                  </Text>
                </View>
                <View style={styles.branchDetailRow}>
                  <Ionicons name="call-outline" size={14} color={colors.neutral.gray.medium} />
                  <Text style={styles.branchDetailText}>{branch.contact}</Text>
                </View>
                {branch.description && (
                  <View style={styles.branchDetailRow}>
                    <Ionicons name="document-text-outline" size={14} color={colors.neutral.gray.medium} />
                    <Text style={styles.branchDetailText} numberOfLines={2}>
                      {branch.description}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default ViewStaffBranchesTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
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
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  branchCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  branchCardContent: {
    padding: 16,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  branchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  branchLocation: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  lockedText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
    color: colors.semantic.error,
  },
  branchDetails: {
    gap: 8,
    marginTop: 8,
  },
  branchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchDetailText: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    flex: 1,
  },
});

