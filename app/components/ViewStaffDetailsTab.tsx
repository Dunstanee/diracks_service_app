import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { formatDateCustom } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Staff {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: number;
  country: string | null;
  userNumber: string;
  gender: number;
  birthDate: string;
  verified: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ViewStaffDetailsTabProps {
  staff: Staff;
  organizationStaffId: string;
}

const ViewStaffDetailsTab: React.FC<ViewStaffDetailsTabProps> = ({ staff }) => {
  const getGenderLabel = (gender: number): string => {
    switch (gender) {
      case 1:
        return 'Male';
      case 2:
        return 'Female';
      case 3:
        return 'Transgender';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDateCustom(date.getTime() / 1000, 'MM/DD/YYYY');
    } catch {
      return dateString;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>
              {[staff.firstName, staff.middleName, staff.lastName].filter(Boolean).join(' ') || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{staff.email}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{staff.phone}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Birth Date</Text>
            <Text style={styles.detailValue}>{formatDate(staff.birthDate)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{getGenderLabel(staff.gender)}</Text>
          </View>
        </View>

        {staff.country && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={colors.neutral.gray.medium} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Country</Text>
              <Text style={styles.detailValue}>{staff.country}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="id-card-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>User Number</Text>
            <Text style={styles.detailValue}>{staff.userNumber}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  staff.active
                    ? { backgroundColor: colors.primary.greenLight + '20' }
                    : { backgroundColor: colors.semantic.error + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    staff.active ? { color: colors.primary.green } : { color: colors.semantic.error },
                  ]}
                >
                  {staff.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Verification</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  staff.verified
                    ? { backgroundColor: colors.primary.greenLight + '20' }
                    : { backgroundColor: colors.neutral.gray.lighter },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    staff.verified ? { color: colors.primary.green } : { color: colors.neutral.gray.medium },
                  ]}
                >
                  {staff.verified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metadata</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {formatDateCustom(staff.createdAt, 'MM/DD/YYYY')}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="refresh-outline" size={20} color={colors.neutral.gray.medium} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>
              {formatDateCustom(staff.updatedAt, 'MM/DD/YYYY')}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default ViewStaffDetailsTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
  },
});

