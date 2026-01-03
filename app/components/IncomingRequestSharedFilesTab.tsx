import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface SharedFile {
  id: string;
  customerId: string;
  bookServiceId: string;
  fileId: string;
  file: {
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

interface IncomingRequestSharedFilesTabProps {
  bookedServiceId: string;
  isCompleted?: boolean;
}

const IncomingRequestSharedFilesTab: React.FC<IncomingRequestSharedFilesTabProps> = ({
  bookedServiceId,
  isCompleted = false,
}) => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const imageUrisRef = useRef<Record<string, string>>({});

  // Keep ref in sync with state
  useEffect(() => {
    imageUrisRef.current = imageUris;
  }, [imageUris]);

  const getImageUri = useCallback(async (systemName: string, fileId: string): Promise<void> => {
    // Check both ref and state to avoid race conditions
    if (imageUrisRef.current[fileId] || loadingImages.has(fileId)) return;

    setLoadingImages((prev) => new Set(prev).add(fileId));

    try {
      const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN || process.env.API_DOMAIN || '';
      const authToken = useAuthStore.getState().token;

      const response = await fetch(`${API_DOMAIN}/file/resource/${systemName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
        return;
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageUris((prev) => {
          const updated = { ...prev, [fileId]: dataUri };
          imageUrisRef.current = updated;
          return updated;
        });
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load image:', err);
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  }, [loadingImages]);

  const fetchSharedFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<SharedFile[]>(
        `/en/auth/shared/service/files/${bookedServiceId}`,
        {
          requiresAuth: true,
        }
      );

      const fetchedFiles = response.data || [];
      setFiles(fetchedFiles);

      // Pre-load images after a short delay to avoid blocking initial render
      setTimeout(() => {
        fetchedFiles.forEach((file) => {
          if (file.file.mimeType.startsWith('image/')) {
            getImageUri(file.file.systemName, file.file.id);
          }
        });
      }, 100);
    } catch (err: any) {
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [bookedServiceId, getImageUri]);

  useEffect(() => {
    fetchSharedFiles();
  }, [fetchSharedFiles]);

  const handleDownload = async (file: SharedFile) => {
    try {
      const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN || process.env.API_DOMAIN || '';
      const authToken = useAuthStore.getState().token;

      const fileUrl = `${API_DOMAIN}/file/resource/${file.file.systemName}`;
      
      // Open file in browser for download
      // TODO: Implement proper file download/sharing if expo-file-system and expo-sharing are available
      console.log('Download file:', fileUrl);
      
      // For now, we can show a message or open the URL
      // In a real implementation, you would use Linking.openURL(fileUrl) or proper file download
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isPDF = (mimeType: string) => mimeType === 'application/pdf';

  if (isLoading) {
    return (
      <View style={styles.listContent}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.fileCard}>
            {/* Image/Preview Skeleton */}
            <Skeleton width="100%" height={200} borderRadius={0} />
            
            {/* File Info Skeleton */}
            <View style={styles.fileInfo}>
              <Skeleton width="80%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={12} borderRadius={6} style={{ marginBottom: 6 }} />
              <Skeleton width="40%" height={12} borderRadius={6} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (files.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-outline" size={48} color={colors.neutral.gray.light} />
        <Text style={styles.emptyText}>No shared files</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.listContent}>
        {files.map((item) => {
          const isImageFile = isImage(item.file.mimeType);
          const hasImageUri = !!imageUris[item.file.id];

          return (
            <View key={item.id} style={styles.fileCard}>
              {isImageFile ? (
                hasImageUri ? (
                  <TouchableOpacity
                    onPress={() => setSelectedImage(imageUris[item.file.id])}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: imageUris[item.file.id] }}
                      style={styles.fileImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.fileImageContainer}>
                    <Skeleton width="100%" height={200} borderRadius={0} />
                  </View>
                )
              ) : isPDF(item.file.mimeType) ? (
              <View style={styles.filePreview}>
                <Ionicons name="document-text" size={48} color={colors.primary.green} />
                <Text style={styles.filePreviewText}>PDF Document</Text>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    // TODO: Open PDF viewer
                    console.log('View PDF:', item.file.name);
                  }}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.filePreview}>
                <Ionicons name="document" size={48} color={colors.neutral.gray.medium} />
                <Text style={styles.filePreviewText}>{item.file.name}</Text>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownload(item)}
                >
                  <Ionicons name="download-outline" size={20} color={colors.text.inverse} />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
              )}

              <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {item.file.name}
              </Text>
              <Text style={styles.fileMeta}>
                {item.customer.firstName} {item.customer.lastName} •{' '}
                {formatDateTime(item.createdAt)}
              </Text>
              <Text style={styles.fileSize}>
                {(item.file.fileSize / 1024).toFixed(2)} KB
              </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color={colors.text.inverse} />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </>
  );
};

export default IncomingRequestSharedFilesTab;

const styles = StyleSheet.create({
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
  listContent: {
    padding: 20,
    gap: 16,
  },
  fileCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    overflow: 'hidden',
  },
  fileImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background.secondary,
  },
  fileImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background.secondary,
  },
  filePreview: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  filePreviewText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  viewButton: {
    backgroundColor: colors.primary.green,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary.green,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  fileInfo: {
    padding: 16,
  },
  fileName: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.light,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});

