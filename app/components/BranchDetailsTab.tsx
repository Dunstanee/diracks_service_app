import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { formatDateCustom } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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

interface BranchDetailsTabProps {
  branch: Branch;
}

const BranchDetailsTab: React.FC<BranchDetailsTabProps> = ({ branch }) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Description */}
      {branch.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{branch.description}</Text>
        </View>
      )}

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{branch.email}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="call-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>{branch.contact.toString()}</Text>
          </View>
        </View>
      </View>

      {/* Location Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="location-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{branch.location}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="business-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>City</Text>
            <Text style={styles.infoValue}>{branch.city}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="map-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>State/Province</Text>
            <Text style={styles.infoValue}>{branch.stateProvince}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="navigate-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Coordinates</Text>
            <Text style={styles.infoValue}>
              {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </View>

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        <View style={styles.metadataItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.neutral.gray.medium} />
          <Text style={styles.metadataText}>
            Created: {formatDateCustom(branch.createdAt, 'MMMM DD, YYYY')}
          </Text>
        </View>
        <View style={styles.metadataItem}>
          <Ionicons name="time-outline" size={16} color={colors.neutral.gray.medium} />
          <Text style={styles.metadataText}>
            Updated: {formatDateCustom(branch.updatedAt, 'MMMM DD, YYYY')}
          </Text>
        </View>
        {branch.isMain && (
          <View style={styles.metadataItem}>
            <Ionicons name="star" size={16} color={colors.secondary.orange} />
            <Text style={styles.metadataText}>This is the main branch</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default BranchDetailsTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    lineHeight: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
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
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
});

