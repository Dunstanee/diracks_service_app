import { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface InvoiceItem {
  name: string;
  amount: number;
  quantity: number;
  totalAmount: number;
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
    name: string;
  };
  organization: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
  };
  service: {
    id: string;
    name: string;
  };
  isPublished: boolean;
  isCustomerPaid: boolean;
  isPaymentReceived: boolean;
  createdAt: number;
  updatedAt: number;
  items?: InvoiceItem[];
}

interface IncomingRequestInvoicesTabProps {
  bookedServiceId: string;
  onToast: (message: string, type: ToastType) => void;
  isCompleted?: boolean;
}

// Invoice Preview Modal Component
interface InvoicePreviewModalProps {
  visible: boolean;
  invoice: Invoice;
  onClose: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ visible, invoice, onClose }) => {
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const fetchInvoiceItems = useCallback(async () => {
    if (!invoice.id) return;
    
    setIsLoadingItems(true);
    try {
      const response = await api.get<Array<{
        id: string;
        name: string;
        quantity: number;
        amount: number;
        netAmount: number;
        createdAt: number;
        updatedAt: number;
      }>>(
        `/en/auth/booked/service/invoice/${invoice.id}/items`,
        {
          requiresAuth: true,
        }
      );

      // Map API response to InvoiceItem interface (netAmount -> totalAmount)
      const mappedItems: InvoiceItem[] = (response.data || []).map((item) => ({
        name: item.name,
        amount: item.amount,
        quantity: item.quantity,
        totalAmount: item.netAmount, // Map netAmount to totalAmount
      }));

      setInvoiceItems(mappedItems);
    } catch (err: any) {
      console.error("Failed to fetch invoice items:", err);
      setInvoiceItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  }, [invoice.id]);

  // Fetch invoice items when modal becomes visible
  useEffect(() => {
    if (visible && invoice.id) {
      fetchInvoiceItems();
    } else {
      // Reset items when modal closes
      setInvoiceItems([]);
    }
  }, [visible, invoice.id, fetchInvoiceItems]);

  const calculateSubtotal = () => {
    if (!invoiceItems || invoiceItems.length === 0) return 0;
    return invoiceItems.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * invoice.discount) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={previewStyles.modalOverlay}>
        <View style={previewStyles.modalContent}>
          <View style={previewStyles.modalHeader}>
            <Text style={previewStyles.modalTitle}>Invoice Details</Text>
            <TouchableOpacity
              onPress={onClose}
              style={previewStyles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={previewStyles.scrollView} 
            contentContainerStyle={previewStyles.scrollViewContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            bounces={false}
          >
            {/* Invoice Header */}
            <View style={previewStyles.invoiceHeader}>
              <View>
                <Text style={previewStyles.companyName}>{invoice.organization.name}</Text>
                <Text style={previewStyles.branchName}>{invoice.branch.name}</Text>
              </View>
              <View style={previewStyles.invoiceInfo}>
                <Text style={previewStyles.invoiceTitle}>INVOICE</Text>
                <Text style={previewStyles.invoiceNumberText}>#{invoice.invoiceNumber}</Text>
                <Text style={previewStyles.invoiceDateText}>
                  Date: {formatDateTime(invoice.invoiceDate)}
                </Text>
              </View>
            </View>

            {/* Bill To Section */}
            <View style={previewStyles.billToSection}>
              <Text style={previewStyles.sectionLabel}>Bill To:</Text>
              <Text style={previewStyles.customerName}>
                {invoice.customer.firstName} {invoice.customer.lastName}
              </Text>
              <Text style={previewStyles.customerEmail}>{invoice.customer.email}</Text>
            </View>

            {/* Items Table */}
            <View style={previewStyles.itemsTable}>
              <View style={previewStyles.tableHeader}>
                <Text style={[previewStyles.tableHeaderText, { flex: 2 }]}>Item</Text>
                <Text style={[previewStyles.tableHeaderText, { flex: 1 }]}>Total</Text>
              </View>
              {isLoadingItems ? (
                <View style={previewStyles.tableRow}>
                  <ActivityIndicator size="small" color={colors.primary.green} />
                  <Text style={[previewStyles.noItemsText, { marginLeft: 8 }]}>Loading items...</Text>
                </View>
              ) : invoiceItems && invoiceItems.length > 0 ? (
                invoiceItems.map((item, index) => (
                  <View key={index} style={previewStyles.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={previewStyles.itemName}>{item.name}</Text>
                      <Text style={previewStyles.itemDetails}>
                        {item.quantity} X {item.amount.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={[previewStyles.tableCell, { flex: 1 }]}>
                      KES {item.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={previewStyles.tableRow}>
                  <Text style={previewStyles.noItemsText}>No items</Text>
                </View>
              )}
            </View>

            {/* Totals */}
            <View style={previewStyles.totalsSection}>
              <View style={previewStyles.totalRow}>
                <Text style={previewStyles.totalLabel}>Subtotal:</Text>
                <Text style={previewStyles.totalValue}>
                  KES {calculateSubtotal().toFixed(2)}
                </Text>
              </View>
              {invoice.discount > 0 && (
                <View style={previewStyles.totalRow}>
                  <Text style={previewStyles.totalLabel}>Discount ({invoice.discount}%):</Text>
                  <Text style={previewStyles.totalValue}>
                    -KES {calculateDiscountAmount().toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={[previewStyles.totalRow, previewStyles.grandTotalRow]}>
                <Text style={previewStyles.grandTotalLabel}>Total:</Text>
                <Text style={previewStyles.grandTotalValue}>
                  KES {calculateTotal().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Status */}
            <View style={previewStyles.statusSection}>
              <Text style={previewStyles.statusLabel}>Status:</Text>
              <View style={previewStyles.statusBadges}>
                {!invoice.isPublished && (
                  <View style={[previewStyles.statusBadge, previewStyles.draftBadge]}>
                    <Text style={previewStyles.statusBadgeText}>Draft</Text>
                  </View>
                )}
                {invoice.isPublished && (
                  <View style={[previewStyles.statusBadge, previewStyles.publishedBadge]}>
                    <Text style={previewStyles.statusBadgeText}>Published</Text>
                  </View>
                )}
                {invoice.isCustomerPaid && (
                  <View style={[previewStyles.statusBadge, previewStyles.paidBadge]}>
                    <Text style={previewStyles.statusBadgeText}>Paid</Text>
                  </View>
                )}
                {invoice.isPaymentReceived && (
                  <View style={[previewStyles.statusBadge, previewStyles.receivedBadge]}>
                    <Text style={previewStyles.statusBadgeText}>Payment Received</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const IncomingRequestInvoicesTab: React.FC<IncomingRequestInvoicesTabProps> = ({
  bookedServiceId,
  onToast,
  isCompleted = false,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    isPaymentReceived: false,
    customerPaid: false,
    published: false,
  });
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishingInvoices, setPublishingInvoices] = useState<Set<string>>(new Set());
  const [markingPaidInvoices, setMarkingPaidInvoices] = useState<Set<string>>(new Set());
  const [deletingInvoices, setDeletingInvoices] = useState<Set<string>>(new Set());

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.isPaymentReceived) params.isPaymentReceived = 'true';
      if (filters.customerPaid) params.customerPaid = 'true';
      if (filters.published) params.published = 'false';

      const response = await api.get<Invoice[]>(
        `/en/auth/booked/service/invoices/${bookedServiceId}`,
        {
          requiresAuth: true,
          params,
        }
      );

      setInvoices(response.data || []);
    } catch (err: any) {
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [bookedServiceId, filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleOpenCreateModal = () => {
    setInvoiceItems([{ name: '', amount: 0, quantity: 1, totalAmount: 0 }]);
    setDiscount('0');
    setEditingInvoice(null);
    setIsCreateModalVisible(true);
  };

  const handleOpenEditModal = async (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDiscount(String(invoice.discount || 0));
    setIsCreateModalVisible(true);
    
    // Fetch invoice items
    try {
      const response = await api.get<Array<{
        id: string;
        name: string;
        quantity: number;
        amount: number;
        netAmount: number;
        createdAt: number;
        updatedAt: number;
      }>>(
        `/en/auth/booked/service/invoice/${invoice.id}/items`,
        {
          requiresAuth: true,
        }
      );

      // Map API response to InvoiceItem interface (netAmount -> totalAmount)
      const mappedItems: InvoiceItem[] = (response.data || []).map((item) => ({
        name: item.name,
        amount: item.amount,
        quantity: item.quantity,
        totalAmount: item.netAmount,
      }));

      setInvoiceItems(mappedItems.length > 0 ? mappedItems : [{ name: '', amount: 0, quantity: 1, totalAmount: 0 }]);
    } catch (err: any) {
      console.error("Failed to fetch invoice items for editing:", err);
      setInvoiceItems([{ name: '', amount: 0, quantity: 1, totalAmount: 0 }]);
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalVisible(false);
    setInvoiceItems([]);
    setDiscount('0');
    setEditingInvoice(null);
  };

  const handleAddInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { name: '', amount: 0, quantity: 1, totalAmount: 0 }]);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleUpdateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate totalAmount
    if (field === 'amount' || field === 'quantity') {
      updatedItems[index].totalAmount = updatedItems[index].amount * updatedItems[index].quantity;
    }

    setInvoiceItems(updatedItems);
  };

  const calculateTotal = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const discountAmount = (subtotal * parseFloat(discount || '0')) / 100;
    return subtotal - discountAmount;
  };

  // Validate form - check if all required fields are filled
  // Accept 0 as valid value (not empty)
  const isFormValid = () => {
    if (invoiceItems.length === 0) {
      return false;
    }

    // Check if at least one item has all required fields filled
    // Name must not be empty, amount and quantity can be 0 or greater
    const hasValidItems = invoiceItems.some(item => {
      const hasName = item.name.trim().length > 0;
      const hasAmount = item.amount >= 0; // Accept 0
      const hasQuantity = item.quantity >= 0; // Accept 0
      return hasName && hasAmount && hasQuantity;
    });

    return hasValidItems;
  };

  const handleCreateInvoice = async () => {
    // Validate items - accept 0 as valid
    const validItems = invoiceItems.filter(item => 
      item.name.trim().length > 0 && 
      item.amount >= 0 && 
      item.quantity >= 0
    );
    
    if (validItems.length === 0) {
      onToast('Please add at least one valid invoice item with a name', 'error');
      return;
    }

    // Show confirmation dialog
    const action = editingInvoice ? 'update' : 'create';
    Alert.alert(
      editingInvoice ? 'Update Invoice' : 'Create Invoice',
      editingInvoice 
        ? 'Are you sure you want to update this invoice?'
        : 'Are you sure you want to create this invoice?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: editingInvoice ? 'Update' : 'Create',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const payload = {
                bookedServiceId,
                discount: parseFloat(discount || '0'),
                items: validItems,
              };

              if (editingInvoice) {
                // Update existing invoice
                await api.patch(
                  '/en/on/booked/service/update/invoice',
                  payload,
                  {
                    requiresAuth: true,
                  }
                );
                onToast('Invoice updated successfully', 'success');
              } else {
                // Create new invoice
                await api.post(
                  '/en/on/booked/service/create/invoice',
                  payload,
                  {
                    requiresAuth: true,
                  }
                );
                onToast('Invoice created successfully', 'success');
              }

              handleCloseCreateModal();
              fetchInvoices();
            } catch (err: any) {
              onToast(err?.message || (editingInvoice ? 'Failed to update invoice' : 'Failed to create invoice'), 'error');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handlePublishInvoice = async (invoiceId: string) => {
    Alert.alert(
      'Publish Invoice',
      'Are you sure you want to publish this invoice? Once published, it will be sent to the customer.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Publish',
          onPress: async () => {
            setPublishingInvoices((prev) => new Set(prev).add(invoiceId));
            try {
              await api.patch(
                `/en/on/booked/service/invoice/${invoiceId}/publish`,
                null,
                {
                  requiresAuth: true,
                }
              );

              onToast('Invoice published successfully', 'success');
              fetchInvoices();
            } catch (err: any) {
              onToast(err?.message || 'Failed to publish invoice', 'error');
            } finally {
              setPublishingInvoices((prev) => {
                const next = new Set(prev);
                next.delete(invoiceId);
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    Alert.alert(
      'Mark Payment as Received',
      'Are you sure you want to mark this payment as received? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark as Received',
          onPress: async () => {
            setMarkingPaidInvoices((prev) => new Set(prev).add(invoiceId));
            try {
              await api.post(
                `/en/on/book/service/invoice/${invoiceId}/receivedPayments`,
                null,
                {
                  requiresAuth: true,
                }
              );

              onToast('Payment marked as received', 'success');
              fetchInvoices();
            } catch (err: any) {
              onToast(err?.message || 'Failed to mark payment as received', 'error');
            } finally {
              setMarkingPaidInvoices((prev) => {
                const next = new Set(prev);
                next.delete(invoiceId);
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingInvoices((prev) => new Set(prev).add(invoiceId));
            try {
              await api.delete(
                `/en/on/book/delete/invoice/${invoiceId}`,
                {
                  requiresAuth: true,
                }
              );

              onToast('Invoice deleted successfully', 'success');
              fetchInvoices();
            } catch (err: any) {
              onToast(err?.message || 'Failed to delete invoice', 'error');
            } finally {
              setDeletingInvoices((prev) => {
                const next = new Set(prev);
                next.delete(invoiceId);
                return next;
              });
            }
          },
        },
      ]
    );
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPreviewModalVisible(true);
  };

  return (
    <View style={styles.wrapper}>
      {/* Floating Action Button */}
      {!isCompleted && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleOpenCreateModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={colors.text.inverse} />
            <Text style={styles.fabText}>Create Invoice</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>No invoices found</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {invoices.map((invoice) => {
              const isDraft = !invoice.isPublished;

              return (
                <View key={invoice.id} style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <View style={styles.invoiceHeaderLeft}>
                      <View style={styles.invoiceIconContainer}>
                        <Ionicons name="receipt" size={24} color={colors.primary.green} />
                      </View>
                      <View style={styles.invoiceHeaderInfo}>
                        <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                        <View style={styles.invoiceStatusContainer}>
                        {!invoice.isPublished && (
                          <View style={[styles.statusBadge, styles.statusBadgeDraft]}>
                            <Text style={styles.statusBadgeText}>Draft</Text>
                          </View>
                        )}
                        {invoice.isPublished && (
                          <View style={[styles.statusBadge, styles.statusBadgePublished]}>
                            <Text style={styles.statusBadgeText}>Published</Text>
                          </View>
                        )}
                        {invoice.isCustomerPaid && (
                          <View style={[styles.statusBadge, styles.statusBadgePaid]}>
                            <Text style={styles.statusBadgeText}>Paid</Text>
                          </View>
                        )}
                        {invoice.isPaymentReceived && (
                          <View style={[styles.statusBadge, styles.statusBadgeReceived]}>
                            <Text style={styles.statusBadgeText}>Received</Text>
                          </View>
                        )}
                      </View>
                        <Text style={styles.invoiceDate}>
                          {formatDateTime(invoice.invoiceDate)}
                        </Text>
                        
                      </View>
                      
                    </View>
                    <View style={styles.invoiceHeaderActions}>
                      {isDraft && !isCompleted && (
                        <>
                          <TouchableOpacity
                            style={styles.actionIconButton}
                            onPress={() => handleOpenEditModal(invoice)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="create-outline" size={20} color={colors.primary.green} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionIconButton}
                            onPress={() => handleDeleteInvoice(invoice.id)}
                            disabled={deletingInvoices.has(invoice.id)}
                            activeOpacity={0.7}
                          >
                            {deletingInvoices.has(invoice.id) ? (
                              <ActivityIndicator size="small" color={colors.semantic.error} />
                            ) : (
                              <Ionicons name="trash-outline" size={20} color={colors.semantic.error} />
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={styles.invoiceDetails}>
                    <View style={styles.invoiceDetailItem}>
                      <Text style={styles.invoiceDetailLabel}>Service</Text>
                      <Text style={styles.invoiceDetailValue}>{invoice.service.name}</Text>
                    </View>

                    <View style={styles.invoiceDetailItem}>
                      <Text style={styles.invoiceDetailLabel}>Customer</Text>
                      <Text style={styles.invoiceDetailValue}>
                        {invoice.customer.firstName} {invoice.customer.lastName}
                      </Text>
                    </View>

                    <View style={styles.invoiceDetailItem}>
                      <Text style={styles.invoiceDetailLabel}>Branch</Text>
                      <Text style={styles.invoiceDetailValue}>{invoice.branch.name}</Text>
                    </View>

                    {invoice.discount > 0 && (
                      <View style={styles.invoiceDetailItem}>
                        <Text style={styles.invoiceDetailLabel}>Discount</Text>
                        <Text style={styles.invoiceDetailValue}>{invoice.discount}%</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.invoiceActions}>
                    <TouchableOpacity
                      style={styles.previewButton}
                      onPress={() => handlePreviewInvoice(invoice)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye-outline" size={18} color={colors.primary.green} />
                      <Text style={styles.previewButtonText}>Preview</Text>
                    </TouchableOpacity>

                    {isDraft && !isCompleted && (
                      <TouchableOpacity
                        style={styles.publishButton}
                        onPress={() => handlePublishInvoice(invoice.id)}
                        disabled={publishingInvoices.has(invoice.id)}
                        activeOpacity={0.7}
                      >
                        {publishingInvoices.has(invoice.id) ? (
                          <ActivityIndicator size="small" color={colors.text.inverse} />
                        ) : (
                          <>
                            <Ionicons name="send-outline" size={18} color={colors.text.inverse} />
                            <Text style={styles.publishButtonText}>Publish</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    {invoice.isPublished && !invoice.isPaymentReceived && !invoice.isCustomerPaid && (
                      <View style={styles.waitingForPaymentContainer}>
                        <Ionicons name="timer-outline" size={18} color={colors.text.inverse} />
                        <Text style={styles.waitingForPaymentText}>Waiting for payment</Text>
                      </View>
                    )}

                    {invoice.isPublished && !invoice.isPaymentReceived && invoice.isCustomerPaid && !isCompleted && (
                      <TouchableOpacity
                        style={styles.markPaidButton}
                        onPress={() => handleMarkAsPaid(invoice.id)}
                        disabled={markingPaidInvoices.has(invoice.id)}
                        activeOpacity={0.7}
                      >
                        {markingPaidInvoices.has(invoice.id) ? (
                          <ActivityIndicator size="small" color={colors.text.inverse} />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={18} color={colors.text.inverse} />
                            <Text style={styles.markPaidButtonText}>Mark as Paid</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}



      {/* Create/Edit Invoice Modal */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseCreateModal}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Invoice Items */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Invoice Items</Text>
                {invoiceItems.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemContainer}>
                      <TextInput
                        style={[styles.itemInput, styles.itemNameInput]}
                        placeholder="Item name"
                        placeholderTextColor={colors.neutral.gray.medium}
                        value={item.name}
                        onChangeText={(text) => handleUpdateInvoiceItem(index, 'name', text)}
                      />
                      <View style={styles.itemDetailsRow}>
                        <TextInput
                          style={[styles.itemInput, styles.itemAmountInput]}
                          placeholder="Amount"
                          placeholderTextColor={colors.neutral.gray.medium}
                          value={item.amount > 0 ? String(item.amount) : ''}
                          onChangeText={(text) => {
                            const num = parseFloat(text) || 0;
                            handleUpdateInvoiceItem(index, 'amount', num);
                          }}
                          keyboardType="numeric"
                        />
                        <TextInput
                          style={[styles.itemInput, styles.itemQuantityInput]}
                          placeholder="Qty"
                          placeholderTextColor={colors.neutral.gray.medium}
                          value={item.quantity > 0 ? String(item.quantity) : ''}
                          onChangeText={(text) => {
                            const num = parseFloat(text) || 0;
                            handleUpdateInvoiceItem(index, 'quantity', num);
                          }}
                          keyboardType="numeric"
                        />
                        <Text style={styles.itemTotal}>
                          {item.totalAmount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    {invoiceItems.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeItemButton}
                        onPress={() => handleRemoveInvoiceItem(index)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.semantic.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={handleAddInvoiceItem}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary.green} />
                  <Text style={styles.addItemButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {/* Discount */}
              <View style={styles.discountSection}>
                <Text style={styles.sectionTitle}>Discount (%)</Text>
                <TextInput
                  style={styles.discountInput}
                  placeholder="0"
                  placeholderTextColor={colors.neutral.gray.medium}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                />
              </View>

              {/* Total */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>
                    KES {calculateTotal().toFixed(2)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseCreateModal}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, (!isFormValid() || isSubmitting) && styles.saveButtonDisabled]}
                onPress={handleCreateInvoice}
                disabled={!isFormValid() || isSubmitting}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={[styles.saveButtonText, (!isFormValid() || isSubmitting) && styles.saveButtonTextDisabled]}>
                    Save as Draft
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <InvoicePreviewModal
          visible={isPreviewModalVisible}
          invoice={selectedInvoice}
          onClose={() => setIsPreviewModalVisible(false)}
        />
      )}

       
    </View>
  );
};

export default IncomingRequestInvoicesTab;

const styles = StyleSheet.create({
  waitingForPaymentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.secondary.orange ,
  },
  waitingForPaymentText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  wrapper: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
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
    backgroundColor: colors.background.primary,
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
  invoiceCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    padding: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  invoiceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  invoiceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceHeaderInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  invoiceStatusContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgePublished: {
    backgroundColor: colors.semantic.info + '20',
  },
  statusBadgePaid: {
    backgroundColor: colors.primary.greenLight + '20',
  },
  statusBadgeReceived: {
    backgroundColor: colors.primary.green + '20',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  invoiceDetails: {
    gap: 12,
    marginBottom: 16,
  },
  invoiceDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDetailLabel: {
    fontSize: 13,
    fontFamily: fonts.weights.medium,
    color: colors.neutral.gray.medium,
  },
  invoiceDetailValue: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
    gap: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  invoiceHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    padding: 4,
  },
  statusBadgeDraft: {
    backgroundColor: colors.neutral.gray.light + '20',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.green,
    backgroundColor: colors.background.primary,
  },
  previewButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  publishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary.green,
  },
  publishButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  markPaidButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary.green,
  },
  markPaidButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  fabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 10,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: colors.primary.green,
    elevation: 8,
    shadowColor: colors.primary.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 500,
  },
  itemsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  itemContainer: {
    flex: 1,
    gap: 8,
  },
  itemInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  itemDetailsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  itemInput: {
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  itemNameInput: {
    width: '100%',
  },
  itemAmountInput: {
    flex: 1,
  },
  itemQuantityInput: {
    flex: 0.8,
  },
  itemTotal: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    textAlign: 'right',
  },
  removeItemButton: {
    padding: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary.green,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 8,
  },
  addItemButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  discountSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  discountInput: {
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  totalSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral.gray.light,
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  saveButtonTextDisabled: {
    color: colors.neutral.gray.medium,
  },
});

// Invoice Preview Styles
const previewStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
    shadowColor: '#000',
    minHeight: Dimensions.get('window').height * 0.9,

    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.green,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  invoiceHeader: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  companyName: {
    fontSize: 20,
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
    fontSize: 28,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
    marginBottom: 8,
  },
  invoiceNumberText: {
    fontSize: 16,
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
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
  itemsTable: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.neutral.gray.lightest,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
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
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.neutral.gray.lighter,
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
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  draftBadge: {
    backgroundColor: colors.neutral.gray.light + '20',
  },
  publishedBadge: {
    backgroundColor: colors.semantic.info + '20',
  },
  paidBadge: {
    backgroundColor: colors.primary.greenLight + '20',
  },
  receivedBadge: {
    backgroundColor: colors.primary.green + '20',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
});

