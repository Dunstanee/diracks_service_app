import Button from '@/components/Button';
import Input from '@/components/Input';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { validateField, validateForm } from '@/validators';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

// Password validation schema
const changePasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one capital letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const ChangePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { logout } = useAuthStore();

  // Validate single field on change
  const handleFieldChange = (field: 'password' | 'confirmPassword', value: string) => {
    if (field === 'password') {
      setPassword(value);
    } else {
      setConfirmPassword(value);
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
    const fieldError = validateField(changePasswordSchema, field, value);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }

    // Validate password match if confirmPassword is filled
    if (field === 'password' && confirmPassword) {
      if (value !== confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          if (newErrors.confirmPassword === 'Passwords do not match') {
            delete newErrors.confirmPassword;
          }
          return newErrors;
        });
      }
    }

    // Validate password match if password is filled
    if (field === 'confirmPassword' && password) {
      if (value !== password) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          if (newErrors.confirmPassword === 'Passwords do not match') {
            delete newErrors.confirmPassword;
          }
          return newErrors;
        });
      }
    }
  };

  const handleChangePassword = async () => {
    // Validate entire form
    const validation = validateForm(changePasswordSchema, { password, confirmPassword });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsLoading(true);

    try {
      // Make API call to update password
      const response = await api.post(
        '/en/update/password',
        {
          password: password,
        },
        {
          requiresAuth: true,
        }
      );

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Change password failed:', error);
      const errorMessage =
        error?.message || error?.data?.message || 'Failed to change password. Please try again.';

      setErrors({
        general: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Logout user after showing success
    logout();
    router.replace('/');
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.keyboardView}
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
            <Text style={styles.headerTitle}>Change Password</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Text style={styles.subtitle}>
              Enter your new password. Make sure it's strong and secure.
            </Text>

            <Input
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChangeText={(text) => handleFieldChange('password', text)}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={(text) => handleFieldChange('confirmPassword', text)}
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <Button
              title="Change Password"
              variant="primary"
              onPress={handleChangePassword}
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
            <Text style={styles.modalTitle}>Password Updated</Text>
            <Text style={styles.modalMessage}>
              Your password has been updated successfully. You will be logged out for security reasons.
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

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
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
