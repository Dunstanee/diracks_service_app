import Button from '@/components/Button';
import ImageUpload from '@/components/ImageUpload';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Toast, { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { uploadConfig } from '@/constants/upload';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
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

interface ThumbNail {
  id: string;
  name: string;
  systemName: string;
  fileSize: number;
  mimeType: string;
  fileSource: string;
  userId: string;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Service {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isPublic: boolean;
  isDeleted: boolean;
  modeId: number;
  staffId: string;
  thumbNailId: string | null;
  thumbNail: ThumbNail | null;
  mode: ServiceMode;
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

const EditService = () => {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modeId, setModeId] = useState<number | undefined>(undefined);
  const [thumbNailId, setThumbNailId] = useState<string | null>(null);
  const [modes, setModes] = useState<ServiceMode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingModes, setIsLoadingModes] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const getImageUri = useCallback(async (systemName: string): Promise<void> => {
    setIsLoadingBanner(true);
    try {
      const API_DOMAIN = Constants.expoConfig?.extra?.apiDomain as string | undefined || '';
      const authToken = useAuthStore.getState().token;

      const response = await fetch(`${API_DOMAIN}/file/resource/${systemName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        setIsLoadingBanner(false);
        return;
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setBannerUri(dataUri);
        setIsLoadingBanner(false);
      };
      reader.onerror = () => {
        setIsLoadingBanner(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setIsLoadingBanner(false);
    }
  }, []);

  const fetchService = useCallback(async () => {
    if (!serviceId) {
      setErrors({ general: 'Service ID is required' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.get<Service>(`/en/on/service/${serviceId}`, {
        requiresAuth: true,
      });

      const serviceData = response.data;
      setService(serviceData);
      setName(serviceData.name);
      setDescription(serviceData.description);
      setModeId(serviceData.modeId);
      setThumbNailId(serviceData.thumbNailId);

      // Load banner image if thumbnail exists
      if (serviceData.thumbNail?.systemName) {
        getImageUri(serviceData.thumbNail.systemName);
      }
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Failed to load service. Please try again.',
      });
      showToast(err?.message || 'Failed to load service. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, getImageUri]);

  const fetchServiceModes = async () => {
    setIsLoadingModes(true);
    try {
      const response = await api.get<ServiceMode[]>('/en/service/modes', {
        requiresAuth: true,
      });
      setModes(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch service modes:', err);
      setErrors((prev) => ({
        ...prev,
        general: 'Failed to load service modes. Please try again.',
      }));
    } finally {
      setIsLoadingModes(false);
    }
  };

  useEffect(() => {
    fetchService();
    fetchServiceModes();
  }, [fetchService]);

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

  const handleUpdateService = async () => {
    if (!serviceId) return;

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
    setIsSaving(true);

    try {
      // Make API call to update service
      await api.patch(
        `/en/on/service/${serviceId}`,
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

      showToast('Service updated successfully', 'success');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Update service failed:', error);
      const errorMessage =
        error?.message || error?.data?.message || 'Failed to update service. Please try again.';

      setErrors({
        general: errorMessage,
      });
      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const modeOptions = modes
    .filter((mode) => mode.isActive)
    .map((mode) => ({
      label: mode.name,
      value: mode.id,
    }));

  const defaultBanner = require('@/assets/backgroud/default-banner.png');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Loading service...</Text>
      </View>
    );
  }

  if (errors.general && !service) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.semantic.error} />
        <Text style={styles.errorText}>{errors.general}</Text>
        <Button
          title="Go Back"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Service</Text>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >


          {/* Banner */}
          <View style={styles.bannerContainer}>
            {isLoadingBanner ? (
              <View style={styles.bannerPlaceholder}>
                <ActivityIndicator size="large" color={colors.primary.green} />
              </View>
            ) : bannerUri ? (
              <ImageBackground
                source={{ uri: bannerUri }}
                style={styles.banner}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={styles.bannerGradient}
                />
              </ImageBackground>
            ) : (
              <ImageBackground
                source={defaultBanner}
                style={styles.banner}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={styles.bannerGradient}
                />
              </ImageBackground>
            )}
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Text style={styles.subtitle}>
              Update the service information below.
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
              title="Update Service"
              variant="primary"
              onPress={handleUpdateService}
              loading={isSaving || isLoadingModes}
              disabled={isSaving || isLoadingModes}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default EditService;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.primary.green,
    position: 'sticky',
    fontFamily: fonts.weights.regular,
    top: 0,
    zIndex: 1000,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
  },
  banner: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.gray.lighter,
  },
  form: {
    padding: 20,
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
  submitButton: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 16,
  },
});
