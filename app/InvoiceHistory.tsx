import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  amount: number;
  netAmount: number;
  createdAt: number;
  updatedAt: number;
}

interface Invoice {
  id: string;
  customerId: string;
  bookServiceId: string;
  serviceId: string;
  organizationId: string;
  branchId: string;
  staffId: string;
  invoiceNumber: string;
  invoiceDate: string;
  discount: number;
  branch: {
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
  };
  organization: {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    isServiceProvider: boolean;
    createdAt: number;
    updatedAt: number;
  };
  customer: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    phone: number;
    country: string;
    userNumber: string;
    gender: number;
    birthDate: string;
    verified: boolean;
    active: boolean;
    createdAt: number;
    updatedAt: number;
  };
  service: {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    isPublic: boolean;
    isDeleted: boolean;
    modeId: number;
    staffId: string;
    thumbNailId: string | null;
    thumbNail?: {
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
    } | null;
    createdAt: number;
    updatedAt: number;
  };
  isPublished: boolean;
  isCustomerPaid: boolean;
  isPaymentReceived: boolean;
  staff?: {
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
  };
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

interface InvoicePreviewData extends Invoice {
  // Extended for preview modal
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [selectedInvoice, setSelectedInvoice] = useState<InvoicePreviewData | null>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewInvoiceItems, setPreviewInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isLoadingPreviewItems, setIsLoadingPreviewItems] = useState(false);

  const capitalizeName = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getImageUri = useCallback(async (systemName: string, invoiceId: string): Promise<void> => {
    if (imageUris[invoiceId] || loadingImages.has(systemName) || failedImages.has(systemName)) {
      return;
    }

    setLoadingImages((prev) => new Set(prev).add(systemName));

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
        setFailedImages((prev) => new Set(prev).add(systemName));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
        return;
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageUris((prev) => ({ ...prev, [invoiceId]: dataUri }));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
      };
      reader.onerror = () => {
        setFailedImages((prev) => new Set(prev).add(systemName));
        setLoadingImages((prev) => {
          const next = new Set(prev);
          next.delete(systemName);
          return next;
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load image:', err);
      setFailedImages((prev) => new Set(prev).add(systemName));
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(systemName);
        return next;
      });
    }
  }, [imageUris, loadingImages, failedImages]);

  const fetchInvoiceHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Invoice[]>('/en/on/book/service/invoices/histories', {
        requiresAuth: true,
      });

      const sortedInvoices = (response.data || []).sort(
        (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      );

      setInvoices(sortedInvoices);
      setFilteredInvoices(sortedInvoices);

      // Load images for invoices with thumbnails
      sortedInvoices.forEach((invoice) => {
        if (invoice.service.thumbNail?.systemName) {
          getImageUri(invoice.service.thumbNail.systemName, invoice.id);
        }
      });
    } catch (err: any) {
      console.error('Failed to fetch invoice history:', err);
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [getImageUri]);

  useEffect(() => {
    fetchInvoiceHistory();
  }, [fetchInvoiceHistory]);

  useEffect(() => {
    // Filter invoices based on search query
    if (searchQuery.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = invoices.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.service.name.toLowerCase().includes(query) ||
          invoice.customer.firstName.toLowerCase().includes(query) ||
          invoice.customer.lastName.toLowerCase().includes(query) ||
          invoice.branch.name.toLowerCase().includes(query)
      );
      setFilteredInvoices(filtered);
    }
  }, [searchQuery, invoices]);

  const fetchPreviewInvoice = useCallback(async (invoiceId: string) => {
    setIsLoadingPreviewItems(true);
    try {
      // Fetch full invoice details
      const invoiceResponse = await api.get<InvoicePreviewData>(
        `/en/auth/booked/service/invoice/${invoiceId}`,
        {
          requiresAuth: true,
        }
      );
      setSelectedInvoice(invoiceResponse.data);

      // Fetch invoice items
      const itemsResponse = await api.get<InvoiceItem[]>(
        `/en/auth/booked/service/invoice/${invoiceId}/items`,
        {
          requiresAuth: true,
        }
      );
      setPreviewInvoiceItems(itemsResponse.data || []);
    } catch (err: any) {
      console.error('Failed to fetch invoice preview:', err);
      setSelectedInvoice(null);
      setPreviewInvoiceItems([]);
    } finally {
      setIsLoadingPreviewItems(false);
    }
  }, []);

  const handlePreviewInvoice = (invoice: Invoice) => {
    setIsPreviewModalVisible(true);
    fetchPreviewInvoice(invoice.id);
  };

  const handleClosePreview = () => {
    setIsPreviewModalVisible(false);
    setSelectedInvoice(null);
    setPreviewInvoiceItems([]);
  };

  const getStatusBadges = (invoice: Invoice) => {
    const badges = [];
    if (!invoice.isPublished) {
      badges.push({ label: 'Draft', color: colors.secondary.orange, bgColor: colors.secondary.orangeLight + '20' });
    }
    if (invoice.isPublished) {
      badges.push({ label: 'Published', color: colors.semantic.info, bgColor: colors.semantic.info + '20' });
    }
    if (invoice.isCustomerPaid) {
      badges.push({ label: 'Paid', color: colors.primary.green, bgColor: colors.primary.greenLight + '20' });
    }
    if (invoice.isPaymentReceived) {
      badges.push({ label: 'Received', color: colors.primary.green, bgColor: colors.primary.greenLight + '20' });
    }
    return badges;
  };

  const calculateSubtotal = () => {
    if (!previewInvoiceItems || previewInvoiceItems.length === 0) return 0;
    return previewInvoiceItems.reduce((sum, item) => sum + item.netAmount, 0);
  };

  const calculateDiscountAmount = () => {
    if (!selectedInvoice) return 0;
    const subtotal = calculateSubtotal();
    return (subtotal * selectedInvoice.discount) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => {
    const hasThumbnail = item.service.thumbNail?.systemName;
    const imageUri = imageUris[item.id];
    const isLoadingImage = hasThumbnail && loadingImages.has(item.service.thumbNail!.systemName);
    const isFailedImage = hasThumbnail && failedImages.has(item.service.thumbNail!.systemName);
    const statusBadges = getStatusBadges(item);
    const customerName = `${capitalizeName(item.customer.firstName)} ${capitalizeName(item.customer.lastName)}`.trim();

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        onPress={() => handlePreviewInvoice(item)}
        activeOpacity={0.7}
      >
        {/* Service Image Cover */}
        <View style={styles.serviceImageContainer}>
          {isLoadingImage ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="small" color={colors.primary.green} />
            </View>
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.serviceImage} resizeMode="cover" />
          ) : (
            <ImageBackground
              source={require('@/assets/backgroud/invoice-image.png')}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Invoice Content */}
        <View style={styles.invoiceContent}>
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceHeaderLeft}>
              <View style={styles.invoiceNumberContainer}>
                <Ionicons name="receipt-outline" size={16} color={colors.primary.green} />
                <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
              </View>
              <View style={styles.statusBadgesContainer}>
                {statusBadges.map((badge, index) => (
                  <View
                    key={index}
                    style={[
                      styles.statusBadge,
                      { backgroundColor: badge.bgColor },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.gray.medium} />
          </View>

          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {item.service.name}
            </Text>
          </View>

          <View style={styles.invoiceDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {customerName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.branch.name}
              </Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.dateText}>
                {formatDateTime(new Date(item.invoiceDate).getTime() / 1000)}
              </Text>
            </View>
            {item.discount > 0 && (
              <View style={styles.discountRow}>
                <Ionicons name="pricetag-outline" size={14} color={colors.secondary.orange} />
                <Text style={styles.discountText}>
                  Discount: {item.discount}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Field */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.neutral.gray.medium}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by invoice number, service, customer, or branch..."
            placeholderTextColor={colors.neutral.gray.medium}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.neutral.gray.medium} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Invoice List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
          <Text style={styles.loadingText}>Loading invoice history...</Text>
        </View>
      ) : filteredInvoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No invoices found' : 'No invoice history available'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
              activeOpacity={0.7}
            >
              <Text style={styles.clearSearchText}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          renderItem={renderInvoiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchInvoiceHistory}
        />
      )}

      {/* Invoice Preview Modal */}
      <Modal
        visible={isPreviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClosePreview}
      >
        <View style={previewStyles.modalOverlay}>
          <View style={previewStyles.modalContent}>
            <View style={previewStyles.modalHeader}>
              <Text style={previewStyles.modalTitle}>Invoice Details</Text>
              <TouchableOpacity
                onPress={handleClosePreview}
                style={previewStyles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {isLoadingPreviewItems ? (
              <View style={previewStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.green} />
                <Text style={previewStyles.loadingText}>Loading invoice details...</Text>
              </View>
            ) : selectedInvoice ? (
              <ScrollView
                style={previewStyles.scrollView}
                contentContainerStyle={previewStyles.scrollViewContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                bounces={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Invoice Header */}
                <View style={previewStyles.invoiceHeader}>
                  <View>
                    <Text style={previewStyles.companyName}>{selectedInvoice.organization.name}</Text>
                    <Text style={previewStyles.branchName}>{selectedInvoice.branch.name}</Text>
                  </View>
                  <View style={previewStyles.invoiceInfo}>
                    <Text style={previewStyles.invoiceTitle}>INVOICE</Text>
                    <Text style={previewStyles.invoiceNumberText}>#{selectedInvoice.invoiceNumber}</Text>
                    <Text style={previewStyles.invoiceDateText}>
                      Date: {formatDateTime(new Date(selectedInvoice.invoiceDate).getTime() / 1000)}
                    </Text>
                  </View>
                </View>

                {/* Bill To Section */}
                <View style={previewStyles.billToSection}>
                  <Text style={previewStyles.sectionLabel}>Bill To:</Text>
                  <Text style={previewStyles.customerName}>
                    {capitalizeName(selectedInvoice.customer.firstName)} {capitalizeName(selectedInvoice.customer.lastName)}
                  </Text>
                  <Text style={previewStyles.customerEmail}>{selectedInvoice.customer.email}</Text>
                </View>

                {/* Served By Section */}
                {selectedInvoice.staff && (
                  <View style={previewStyles.servedBySection}>
                    <Text style={previewStyles.sectionLabel}>Served By:</Text>
                    <Text style={previewStyles.staffName}>
                      {capitalizeName(selectedInvoice.staff.firstName)} {capitalizeName(selectedInvoice.staff.lastName)}
                    </Text>
                    <Text style={previewStyles.staffEmail}>{selectedInvoice.staff.email}</Text>
                  </View>
                )}

                {/* Items Table */}
                <View style={previewStyles.itemsTable}>
                  <View style={previewStyles.tableHeader}>
                    <Text style={[previewStyles.tableHeaderText, { flex: 2 }]}>Item</Text>
                    <Text style={[previewStyles.tableHeaderText, { flex: 1 }]}>Total</Text>
                  </View>
                  {previewInvoiceItems && previewInvoiceItems.length > 0 ? (
                    previewInvoiceItems.map((item, index) => (
                      <View key={index} style={previewStyles.tableRow}>
                        <View style={{ flex: 2 }}>
                          <Text style={previewStyles.itemName}>{item.name}</Text>
                          <Text style={previewStyles.itemDetails}>
                            {item.quantity} X {item.amount.toFixed(2)}
                          </Text>
                        </View>
                        <Text style={[previewStyles.tableCell, { flex: 1 }]}>
                          KES {item.netAmount.toFixed(2)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={previewStyles.tableRow}>
                      <Text style={previewStyles.noItemsText}>No items</Text>
                    </View>
                  )}
                </View>

                {/* Totals Section */}
                <View style={previewStyles.totalsSection}>
                  <View style={previewStyles.totalRow}>
                    <Text style={previewStyles.totalLabel}>Subtotal:</Text>
                    <Text style={previewStyles.totalValue}>KES {calculateSubtotal().toFixed(2)}</Text>
                  </View>
                  {selectedInvoice.discount > 0 && (
                    <View style={previewStyles.totalRow}>
                      <Text style={previewStyles.totalLabel}>
                        Discount ({selectedInvoice.discount}%):
                      </Text>
                      <Text style={previewStyles.totalValue}>
                        -KES {calculateDiscountAmount().toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <View style={[previewStyles.totalRow, previewStyles.grandTotalRow]}>
                    <Text style={previewStyles.grandTotalLabel}>Total:</Text>
                    <Text style={previewStyles.grandTotalValue}>KES {calculateTotal().toFixed(2)}</Text>
                  </View>
                </View>

                {/* Status Section */}
                <View style={previewStyles.statusSection}>
                  <Text style={previewStyles.sectionLabel}>Status:</Text>
                  <View style={previewStyles.statusBadgesContainer}>
                    {!selectedInvoice.isPublished && (
                      <View style={[previewStyles.statusBadge, { backgroundColor: colors.secondary.orangeLight + '20' }]}>
                        <Text style={[previewStyles.statusBadgeText, { color: colors.secondary.orange }]}>Draft</Text>
                      </View>
                    )}
                    {selectedInvoice.isPublished && (
                      <View style={[previewStyles.statusBadge, { backgroundColor: colors.semantic.info + '20' }]}>
                        <Text style={[previewStyles.statusBadgeText, { color: colors.semantic.info }]}>Published</Text>
                      </View>
                    )}
                    {selectedInvoice.isCustomerPaid && (
                      <View style={[previewStyles.statusBadge, { backgroundColor: colors.primary.greenLight + '20' }]}>
                        <Text style={[previewStyles.statusBadgeText, { color: colors.primary.green }]}>Paid</Text>
                      </View>
                    )}
                    {selectedInvoice.isPaymentReceived && (
                      <View style={[previewStyles.statusBadge, { backgroundColor: colors.primary.greenLight + '20' }]}>
                        <Text style={[previewStyles.statusBadgeText, { color: colors.primary.green }]}>Payment Received</Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={previewStyles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.error} />
                <Text style={previewStyles.errorText}>Failed to load invoice details</Text>
                <TouchableOpacity
                  style={previewStyles.retryButton}
                  onPress={handleClosePreview}
                  activeOpacity={0.7}
                >
                  <Text style={previewStyles.retryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default InvoiceHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.gray.lightest,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  invoiceCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  serviceImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background.secondary,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  invoiceContent: {
    padding: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  invoiceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  invoiceNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invoiceNumber: {
    fontSize: 14,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  statusBadgesContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
  },
  serviceInfo: {
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  invoiceDetails: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 120,
  },
  detailText: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    flex: 1,
  },
  dateContainer: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountText: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.secondary.orange,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.medium,
    marginTop: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
});

const previewStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    height: Dimensions.get('window').height * 0.85,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  invoiceHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  companyName: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  branchName: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  invoiceInfo: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
    marginBottom: 4,
  },
  invoiceNumberText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  invoiceDateText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  billToSection: {
    marginBottom: 24,
  },
  servedBySection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  staffName: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  itemsTable: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.gray.lightest,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  tableHeaderText: {
    fontSize: 14,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  tableCell: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  itemName: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  noItemsText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  totalsSection: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.neutral.gray.lighter,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
  },
  statusSection: {
    marginBottom: 16,
  },
  statusBadgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
  },
});
