import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { formatFileSize as formatSize, uploadConfig } from '@/constants/upload';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface UploadedFile {
  id: string;
  uri: string;
  name: string;
  progress: number;
  isUploading: boolean;
  error?: string;
}

export interface ImageUploadProps {
  /**
   * Label for the upload component
   */
  label?: string;
  /**
   * Whether to allow multiple image selection
   */
  multiple?: boolean;
  /**
   * Maximum file size in bytes (default: from uploadConfig.maxImageSize)
   */
  maxSize?: number;
  /**
   * Allowed file types (default: ['image'])
   */
  fileTypes?: ('image' | 'video')[];
  /**
   * Current file IDs (for displaying selected images)
   */
  value?: string | string[];
  /**
   * Callback when files are uploaded
   * Returns file ID(s) - string if multiple is false, string[] if multiple is true
   */
  onChange?: (ids: string | string[]) => void;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Maximum number of images allowed (only applies when multiple is true)
   */
  maxImages?: number;
}

/**
 * Reusable Image Upload Component
 * Supports single or multiple image uploads with configurable file types and size limits
 * Automatically uploads files and returns file IDs
 */
export default function ImageUpload({
  label = 'Upload Image',
  multiple = false,
  maxSize = uploadConfig.maxImageSize,
  fileTypes = ['image'],
  value,
  onChange,
  error,
  maxImages = uploadConfig.maxImages,
}: ImageUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Initialize from value prop if provided
  React.useEffect(() => {
    if (value) {
      const ids = Array.isArray(value) ? value : [value];
      // If we have IDs but no uploaded files, we need to fetch or display them
      // For now, we'll just track the IDs
      setUploadedFiles((prev) => {
        const existingIds = prev.map((f) => f.id);
        const newIds = ids.filter((id) => !existingIds.includes(id));
        return [
          ...prev,
          ...newIds.map((id) => ({
            id,
            uri: '', // We don't have the URI for existing files
            name: '',
            progress: 100,
            isUploading: false,
          })),
        ];
      });
    }
  }, [value]);

  // Track previous IDs to avoid unnecessary onChange calls
  const prevIdsRef = React.useRef<string>('');

  // Update parent component when file IDs change (only when uploads complete)
  React.useEffect(() => {
    if (!onChange) return;
    
    const completedFiles = uploadedFiles.filter((f) => f.id && !f.isUploading);
    if (completedFiles.length === 0) return;

    const allIds = completedFiles.map((f) => f.id);
    const idsString = allIds.join(',');
    
    // Only call onChange if IDs have actually changed
    if (prevIdsRef.current !== idsString) {
      prevIdsRef.current = idsString;
      
      if (multiple) {
        onChange(allIds);
      } else {
        onChange(allIds[0] || '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles]);

  const uploadFile = async (uri: string, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      // Get file extension from URI or fileName
      const fileExtension = fileName.split('.').pop() || uri.split('.').pop() || 'jpg';
      let mimeType = 'image/jpeg';
      
      if (fileExtension === 'png') {
        mimeType = 'image/png';
      } else if (fileExtension === 'gif') {
        mimeType = 'image/gif';
      } else if (fileExtension === 'webp') {
        mimeType = 'image/webp';
      }

      // In React Native, FormData requires a specific format
      // The file object should have uri, type, and name properties
      const file = {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: mimeType,
        name: fileName || `image.${fileExtension}`,
      } as any;

      formData.append('file', file);

      // Get auth token
      const authToken = useAuthStore.getState().token;
      const API_DOMAIN = Constants.expoConfig?.extra?.apiDomain as string | undefined || '';

      xhr.open('POST', `${API_DOMAIN}/en/upload/file`);
      
      if (authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      }

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.uri === uri ? { ...f, progress } : f
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Response format: { id: "...", name: "...", ... } or { data: { id: "...", ... } }
            const fileId = response.id || response.data?.id;
            if (fileId) {
              setUploadedFiles((prev) => {
                return prev.map((f) =>
                  f.uri === uri
                    ? { ...f, id: fileId, progress: 100, isUploading: false }
                    : f
                );
              });
              
              resolve(fileId);
            } else {
              const errorMsg = response.message || 'No file ID in response';
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.uri === uri
                    ? { ...f, isUploading: false, error: errorMsg }
                    : f
                )
              );
              reject(new Error(errorMsg));
            }
          } catch (err) {
            const errorMsg = 'Failed to parse response';
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.uri === uri
                  ? { ...f, isUploading: false, error: errorMsg }
                  : f
              )
            );
            reject(new Error(errorMsg));
          }
        } else {
          let errorMsg = `Upload failed with status ${xhr.status}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMsg = errorResponse.message || errorMsg;
          } catch {
            // Use default error message
          }
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.uri === uri
                ? { ...f, isUploading: false, error: errorMsg }
                : f
            )
          );
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.uri === uri
              ? { ...f, isUploading: false, error: 'Upload failed' }
              : f
          )
        );
        reject(new Error('Network error'));
      };

      xhr.send(formData);
    });
  };

  const pickImage = async () => {
    // Check if single upload mode and file already exists
    if (!multiple) {
      const hasUploadedFile = uploadedFiles.some((f) => f.id && !f.isUploading);
      if (hasUploadedFile) {
        Alert.alert(
          'File Already Uploaded',
          'You can only upload one file at a time. Please remove the current file before uploading a new one.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload images!'
      );
      return;
    }

    try {
      // Use new MediaType API (array of string literals)
      // Options: 'images', 'videos', 'livePhotos' (iOS only)
      let mediaTypes: ImagePicker.MediaType[] = [];
      if (fileTypes.includes('image') && fileTypes.includes('video')) {
        mediaTypes = ['images', 'videos'];
      } else if (fileTypes.includes('image')) {
        mediaTypes = ['images'];
      } else if (fileTypes.includes('video')) {
        mediaTypes = ['videos'];
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes,
        allowsMultipleSelection: multiple,
        quality: uploadConfig.imageQuality,
        allowsEditing: !multiple,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled) {
        const selectedAssets = result.assets;
        const validFiles: { uri: string; name: string }[] = [];
        const errors: string[] = [];

        // Validate files
        for (const asset of selectedAssets) {
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const fileSize = blob.size;

            if (fileSize > maxSize) {
              errors.push(
                `${asset.fileName || 'Image'} exceeds maximum size of ${formatSize(maxSize)}`
              );
              continue;
            }

            validFiles.push({
              uri: asset.uri,
              name: asset.fileName || `image_${Date.now()}.jpg`,
            });
          } catch (err) {
            errors.push('Failed to process image');
          }
        }

        if (errors.length > 0) {
          Alert.alert('Upload Error', errors.join('\n'));
        }

        if (validFiles.length > 0) {
          // Limit to maxImages if multiple
          const filesToUpload = multiple
            ? validFiles.slice(0, maxImages - uploadedFiles.length)
            : [validFiles[0]];

          // Add files to state with uploading status
          const newFiles: UploadedFile[] = filesToUpload.map((file) => ({
            id: '',
            uri: file.uri,
            name: file.name,
            progress: 0,
            isUploading: true,
          }));

          setUploadedFiles((prev) => {
            if (multiple) {
              return [...prev, ...newFiles].slice(0, maxImages);
            } else {
              return newFiles;
            }
          });

          // Upload files sequentially to avoid race conditions
          try {
            for (const file of newFiles) {
              await uploadFile(file.uri, file.name);
            }
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            Alert.alert('Upload Failed', 'Failed to upload one or more images. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    // onChange will be called automatically by useEffect when state updates
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          error && styles.uploadButtonError,
          !multiple && uploadedFiles.some((f) => f.id && !f.isUploading) && styles.uploadButtonDisabled,
        ]}
        onPress={pickImage}
        activeOpacity={0.7}
        disabled={!multiple && uploadedFiles.some((f) => f.id && !f.isUploading)}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={24}
          color={
            error
              ? colors.semantic.error
              : !multiple && uploadedFiles.some((f) => f.id && !f.isUploading)
              ? colors.neutral.gray.medium
              : colors.primary.green
          }
        />
        <Text
          style={[
            styles.uploadButtonText,
            error && styles.uploadButtonTextError,
            !multiple && uploadedFiles.some((f) => f.id && !f.isUploading) && styles.uploadButtonTextDisabled,
          ]}
        >
          {multiple ? 'Upload Images' : 'Upload Image'}
        </Text>
        <Text style={styles.uploadHint}>
          Max {formatSize(maxSize)} • {fileTypes.join(', ')}
        </Text>
      </TouchableOpacity>

      {uploadedFiles.length > 0 && (
        <View style={styles.imagesContainer}>
          {uploadedFiles.map((file, index) => (
            <View key={file.uri || file.id || index} style={styles.imageWrapper}>
              {file.uri ? (
                <Image source={{ uri: file.uri }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color={colors.neutral.gray.medium} />
                </View>
              )}
              
              {/* Upload Progress Overlay */}
              {file.isUploading && (
                <View style={styles.progressOverlay}>
                  <ActivityIndicator size="small" color={colors.primary.green} />
                  <Text style={styles.progressText}>
                    {Math.round(file.progress)}%
                  </Text>
                </View>
              )}

              {/* Progress Bar */}
              {file.isUploading && (
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${file.progress}%` },
                    ]}
                  />
                </View>
              )}

              {/* Error Indicator */}
              {file.error && (
                <View style={styles.errorOverlay}>
                  <Ionicons name="alert-circle" size={24} color={colors.semantic.error} />
                </View>
              )}

              {/* Remove Button */}
              {!file.isUploading && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={24} color={colors.semantic.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
    marginBottom: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: colors.primary.green,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.greenLight + '10',
  },
  uploadButtonError: {
    borderColor: colors.semantic.error,
    backgroundColor: '#FEE2E2' + '20',
  },
  uploadButtonDisabled: {
    borderColor: colors.neutral.gray.lighter,
    backgroundColor: colors.neutral.gray.lighter + '20',
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
    marginTop: 8,
  },
  uploadButtonTextError: {
    color: colors.semantic.error,
  },
  uploadButtonTextDisabled: {
    color: colors.neutral.gray.medium,
  },
  uploadHint: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginTop: 4,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
    marginTop: 4,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary.green,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral.gray.lighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.semantic.error,
    marginTop: 4,
  },
});

