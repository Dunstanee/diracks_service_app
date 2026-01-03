import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { validateField, validateForm } from '@/validators';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { z } from 'zod';

// Extended schema for update profile (without email requirement)
const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  middleName: z.string().optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  gender: z
    .number()
    .min(1, 'Gender is required')
    .max(3, 'Invalid gender selection'),
  birthDate: z
    .string()
    .min(1, 'Birth date is required')
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Please enter a valid date (YYYY-MM-DD)'
    ),
});

const UpdateProfile = () => {
  const { user, updateUser } = useUserStore();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<number | undefined>(undefined);
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setMiddleName((user as any).middleName || '');
      setLastName(user.lastName || '');
      setGender(user.gender || undefined);
      if (user.birthDate) {
        // Convert ISO date to YYYY-MM-DD format
        const date = new Date(user.birthDate);
        const formattedDate = date.toISOString().split('T')[0];
        setBirthDate(formattedDate);
      }
    }
  }, [user]);

  const genderOptions = [
    { label: 'Male', value: 1 },
    { label: 'Female', value: 2 },
    { label: 'Transgender', value: 3 },
  ];

  // Validate single field on change
  const handleFieldChange = (field: string, value: string | number) => {
    if (field === 'firstName') {
      setFirstName(value as string);
    } else if (field === 'middleName') {
      setMiddleName(value as string);
    } else if (field === 'lastName') {
      setLastName(value as string);
    } else if (field === 'gender') {
      setGender(value as number);
    } else if (field === 'birthDate') {
      setBirthDate(value as string);
    }

    // Clear errors when user starts typing
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors[field]) {
        delete newErrors[field];
      }
      if (newErrors.general) {
        delete newErrors.general;
      }
      return newErrors;
    });

    // Validate field in real-time
    if (field !== 'middleName') {
      const fieldError = validateField(updateProfileSchema, field, value);
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError }));
      }
    }
  };

  const handleUpdateProfile = async () => {
    // Validate entire form
    const validation = validateForm(updateProfileSchema, {
      firstName,
      middleName: middleName || undefined,
      lastName,
      gender: gender!,
      birthDate,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsLoading(true);

    try {
      // Make API call to update profile
      const response = await api.patch(
        '/en/auth/user/profile',
        {
          firstName,
          middleName: middleName || '',
          lastName,
          gender: gender!,
          birthDate,
        },
        {
          requiresAuth: true,
        }
      );

      // Update user in store
      updateUser({
        firstName,
        lastName,
        gender: gender!,
        birthDate,
      });

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Update profile failed:', error);
      const errorMessage =
        error?.message || error?.data?.message || 'Failed to update profile. Please try again.';

      setErrors({
        general: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <Text style={styles.headerTitle}>Update Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Text style={styles.subtitle}>
              Update your personal information. Make sure all details are accurate.
            </Text>

            <Input
              label="First Name"
              placeholder="Enter first name"
              value={firstName}
              onChangeText={(text) => handleFieldChange('firstName', text)}
              autoCapitalize="words"
              error={errors.firstName}
            />

            <Input
              label="Middle Name (Optional)"
              placeholder="Enter middle name"
              value={middleName}
              onChangeText={(text) => handleFieldChange('middleName', text)}
              autoCapitalize="words"
              error={errors.middleName}
            />

            <Input
              label="Last Name"
              placeholder="Enter last name"
              value={lastName}
              onChangeText={(text) => handleFieldChange('lastName', text)}
              autoCapitalize="words"
              error={errors.lastName}
            />

            <Select
              label="Gender"
              options={genderOptions}
              value={gender}
              onValueChange={(value) => handleFieldChange('gender', value as number)}
              placeholder="Select gender"
              error={errors.gender}
            />

            <Input
              label="Birth Date"
              placeholder="YYYY-MM-DD (e.g., 1996-05-23)"
              value={birthDate}
              onChangeText={(text) => handleFieldChange('birthDate', text)}
              keyboardType="numeric"
              maxLength={10}
              error={errors.birthDate}
            />

            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <Button
              title="Update Profile"
              variant="primary"
              onPress={handleUpdateProfile}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary.green} />
            </View>
            <Text style={styles.modalTitle}>Profile Updated</Text>
            <Text style={styles.modalMessage}>
              Your profile has been updated successfully.
            </Text>
            <Button
              title="OK"
              variant="primary"
              onPress={handleSuccessModalClose}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default UpdateProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  form: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 24,
    lineHeight: 20,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.semantic.error,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    width: '100%',
  },
});
