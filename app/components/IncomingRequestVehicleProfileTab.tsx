import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface VehicleProfile {
  id: string;
  customerId: string;
  bookServiceId: string;
  vehicleServiceId: string;
  isRevoked: boolean;
  profile: {
    id: string;
    userId: string;
    vehicleIdentificationNumber: string;
    make: string;
    model: string;
    drive: string;
    year: number;
    engineType: string;
    color: string;
    transmission: string;
    bodyType: string;
    fuelType: string;
    licensePlate: string;
    lastServiceDate: string;
    deleted: boolean;
    createdAt: number;
    updatedAt: number;
  };
  customer: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
  };
  createdAt: number;
  updatedAt: number;
}

interface IncomingRequestVehicleProfileTabProps {
  bookedServiceId: string;
  isCompleted?: boolean;
}

const IncomingRequestVehicleProfileTab: React.FC<IncomingRequestVehicleProfileTabProps> = ({
  bookedServiceId,
  isCompleted = false,
}) => {
  const [profiles, setProfiles] = useState<VehicleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVehicleProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<VehicleProfile[]>(
        `/en/auth/share/vehicle/profiles/${bookedServiceId}`,
        {
          requiresAuth: true,
        }
      );

      setProfiles(response.data || []);
    } catch (err: any) {
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [bookedServiceId]);

  useEffect(() => {
    fetchVehicleProfiles();
  }, [fetchVehicleProfiles]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading vehicle profiles...</Text>
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="car-outline" size={48} color={colors.neutral.gray.light} />
        <Text style={styles.emptyText}>No vehicle profiles found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {profiles.map((profile) => (
        <View key={profile.id} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileIconContainer}>
              <Ionicons name="car" size={32} color={colors.primary.green} />
            </View>
            <View style={styles.profileHeaderInfo}>
              <Text style={styles.vehicleName}>
                {profile.profile.make} {profile.profile.model}
              </Text>
              <Text style={styles.vehicleYear}>{profile.profile.year}</Text>
            </View>
            {profile.isRevoked && (
              <View style={styles.revokedBadge}>
                <Text style={styles.revokedBadgeText}>Revoked</Text>
              </View>
            )}
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="id-card-outline" size={18} color={colors.primary.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>License Plate</Text>
                  <Text style={styles.infoValue}>{profile.profile.licensePlate}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="barcode-outline" size={18} color={colors.primary.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>VIN</Text>
                  <Text style={styles.infoValue}>{profile.profile.vehicleIdentificationNumber}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="color-palette-outline" size={18} color={colors.primary.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Color</Text>
                  <View style={styles.colorContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: profile.profile.color },
                      ]}
                    />
                    <Text style={styles.infoValue}>{profile.profile.color}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Body Type</Text>
                  <Text style={styles.specValue}>{profile.profile.bodyType}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Transmission</Text>
                  <Text style={styles.specValue}>{profile.profile.transmission}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Drive</Text>
                  <Text style={styles.specValue}>{profile.profile.drive}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Fuel Type</Text>
                  <Text style={styles.specValue}>{profile.profile.fuelType}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Engine Type</Text>
                  <Text style={styles.specValue}>{profile.profile.engineType}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Information</Text>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Service Date</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(new Date(profile.profile.lastServiceDate).getTime() / 1000)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Owner</Text>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person-outline" size={18} color={colors.primary.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Customer</Text>
                  <Text style={styles.infoValue}>
                    {profile.customer.firstName} {profile.customer.lastName}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default IncomingRequestVehicleProfileTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  profileCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  profileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeaderInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  revokedBadge: {
    backgroundColor: colors.semantic.error + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  revokedBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.semantic.error,
  },
  profileDetails: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  specItem: {
    width: '45%',
    backgroundColor: colors.background.secondary,
    padding: 12,
    borderRadius: 8,
  },
  specLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
});

