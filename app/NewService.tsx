import Button from '@/components/Button';
import ImageUpload from '@/components/ImageUpload';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { uploadConfig } from '@/constants/upload';
import api from '@/services/api';
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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { z } from 'zod';

interface ServiceMode {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Service validation schema
const serviceSchema = z.object({
  name: z
    .string()
    .min(1, 'Service name is required')
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  modeId: z.number().min(1, 'Service mode is required'),
});

const NewService = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modeId, setModeId] = useState<number | undefined>(undefined);
  const [thumbNailId, setThumbNailId] = useState<string | null>(null);
  const [modes, setModes] = useState<ServiceMode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModes, setIsLoadingModes] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchServiceModes();
  }, []);

  const fetchServiceModes = async () => {
    setIsLoadingModes(true);
    try {
      const response = await api.get<ServiceMode[]>('/en/service/modes', {
        requiresAuth: true,
      });
      setModes(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch service modes:', err);
      setErrors({
        general: 'Failed to load service modes. Please try again.',
      });
    } finally {
      setIsLoadingModes(false);
    }
  };

  const handleFieldChange = (field: string, value: string | number) => {
    if (field === 'name') {
      setName(value as string);
    } else if (field === 'description') {
      setDescription(value as string);
    } else if (field === 'modeId') {
      setModeId(value as number);
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
  };

  const handleImageChange = (id: string | string[]) => {
    // ImageUpload component returns ID(s) after upload
    // For single upload, it's a string; for multiple, it's an array
    const fileId = Array.isArray(id) ? id[0] : id;
    setThumbNailId(fileId || null);
  };

  const handleCreateService = async () => {
    // Validate form
    const validation = serviceSchema.safeParse({
      name,
      description,
      modeId: modeId!,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsLoading(true);

    try {
      // Make API call to create service
      const response = await api.post(
        '/en/on/service',
        {
          name,
          description,
          thumbNailId: thumbNailId || null,
          modeId: modeId!,
        },
        {
          requiresAuth: true,
        }
      );

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Create service failed:', error);
      const errorMessage =
        error?.message || error?.data?.message || 'Failed to create service. Please try again.';

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

  const modeOptions = modes
    .filter((mode) => mode.isActive)
    .map((mode) => ({
      label: mode.name,
      value: mode.id,
    }));

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
            <Text style={styles.headerTitle}>New Service</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Text style={styles.subtitle}>
              Create a new service. Fill in all the required information.
            </Text>

            <Input
              label="Service Name"
              placeholder="Enter service name"
              value={name}
              onChangeText={(text) => handleFieldChange('name', text)}
              autoCapitalize="words"
              error={errors.name}
            />

            <View style={styles.textAreaContainer}>
              <Text style={styles.textAreaLabel}>Description</Text>
              <TextInput
                style={[
                  styles.textArea,
                  errors.description && styles.textAreaError,
                ]}
                placeholder="Enter service description"
                placeholderTextColor={colors.neutral.gray.medium}
                value={description}
                onChangeText={(text) => handleFieldChange('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <Select
              label="Service Mode"
              options={modeOptions}
              value={modeId}
              onValueChange={(value) => handleFieldChange('modeId', value as number)}
              placeholder="Select service mode"
              error={errors.modeId}
            />

            <ImageUpload
              label="Service Thumbnail"
              multiple={false}
              maxSize={uploadConfig.maxImageSize}
              fileTypes={['image']}
              value={thumbNailId || undefined}
              onChange={handleImageChange}
              error={errors.thumbNailId}
            />

            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <Button
              title="Create Service"
              variant="primary"
              onPress={handleCreateService}
              loading={isLoading || isLoadingModes}
              disabled={isLoading || isLoadingModes}
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
            <Text style={styles.modalTitle}>Service Created</Text>
            <Text style={styles.modalMessage}>
              Your service has been created successfully.
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

export default NewService;

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
  textAreaContainer: {
    marginBottom: 20,
  },
  textAreaLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  textAreaError: {
    borderColor: colors.semantic.error,
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
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.semantic.error,
    marginTop: 4,
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
