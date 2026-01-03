import { ToastType } from '@/components/Toast';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface RequestDetails {
  id: string;
  bookCode: string;
  description: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  staffId: string | null;
  serviceId: string;
  priceId: string | null;
  bookedDate: number;
  acceptedDate: number | null;
  isAccepted: boolean;
  isActive: boolean;
  isHomeWorkRequest: boolean;
  isCancelled: boolean;
  isDeclined: boolean;
  isCompleted: boolean;
  completedDate: number | null;
  service: {
    id: string;
    name: string;
    description: string;
    mode: {
      id: number;
      name: string;
    };
  };
  branch: {
    id: string;
    name: string;
    email: string;
    contact: number;
    location: string;
    city: string;
    stateProvince: string;
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
  };
}

interface IncomingRequestDetailsTabProps {
  request: RequestDetails;
  onRefresh: () => void;
  onToast: (message: string, type: ToastType) => void;
}

const IncomingRequestDetailsTab: React.FC<IncomingRequestDetailsTabProps> = ({
  request,
  onRefresh,
  onToast,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [incomingProviderId, setIncomingProviderId] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [statusDetails, setStatusDetails] = useState<AcceptStatus | null>(null);
  const [statusCheckComplete, setStatusCheckComplete] = useState(false);
  const [invoices, setInvoices] = useState<Array<{ isPublished: boolean }>>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);


 

  interface AcceptStatus {
    id: string;
    organizationId: string;
    branchId: string;
    bookServiceId: string;
    staffId: string;
    serviceId: string;
    isAccepted: boolean;
    isCancelled: boolean;
    isCustomerCancelled: boolean;
    isCompleted: boolean;
    organization?: {
      id: string;
      name: string;
      description: string;
      isActive: boolean;
      isServiceProvider: boolean;
      createdAt: number;
      updatedAt: number;
    };
    branch?: {
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
    service?: {
      id: string;
      organizationId: string;
      name: string;
      description: string;
      isPublic: boolean;
      isDeleted: boolean;
      modeId: number;
      staffId: string;
      thumbNailId: string | null;
      createdAt: number;
      updatedAt: number;
    };
    createdAt: number;
    updatedAt: number;
  }

  
 
  const checkAcceptStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    setStatusCheckComplete(false);
    try {
      const response = await api.get<AcceptStatus | null>(
        `/en/on/accept/incoming/request/${request.id}/status`,
        {
          requiresAuth: true,
        }
      );

      // Store status (single object or null)
      const fetchedStatus = response.data || null;
      setStatusDetails(fetchedStatus);
      
      
    } catch (err: any) {
      onToast(err?.message || 'Failed to check status. Please try again.', 'error');
      setStatusDetails(null);
    } finally {
      setIsCheckingStatus(false);
      setStatusCheckComplete(true);
    }
  }, [request.id]);

  // Check status on mount if request is not accepted
  useEffect(() => {
      checkAcceptStatus();
  }, [request.id]);

  // Fetch invoices to check for pending ones
  const fetchInvoices = useCallback(async () => {
    if (!request.isAccepted) {
      setInvoices([]);
      return;
    }

    setIsLoadingInvoices(true);
    try {
      const response = await api.get<Array<{ isPublished: boolean }>>(
        `/en/auth/booked/service/invoices/${request.id}`,
        {
          requiresAuth: true,
        }
      );
      setInvoices(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      setInvoices([]);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [request.id, request.isAccepted]);

  useEffect(() => {
    if (request.isAccepted) {
      fetchInvoices();
    }
  }, [request.isAccepted, fetchInvoices]);

  const handleAcceptRequest = async () => {
    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this service request? This will notify the customer and wait for their confirmation.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: async () => {
            setIsAccepting(true);
            try {
              const response = await api.post<{ incomingProviderId?: string }>(
                '/en/on/accept/incoming/request',
                {
                  bookedServiceId: request.id,
                },
                {
                  requiresAuth: true,
                }
              );

              // If response contains incomingProviderId, store it
              if (response.data?.incomingProviderId) {
                setIncomingProviderId(response.data.incomingProviderId);
              }
              
              // Show success toast
              onToast('Request accepted successfully. Waiting for customer confirmation.', 'success');
              
              // Refresh statuses to update UI
              await checkAcceptStatus();
              
              // Refresh to get updated request status
              onRefresh();
            } catch (err: any) {
              // Show error toast
              onToast(err?.message || 'Failed to accept request. Please try again.', 'error');
            } finally {
              setIsAccepting(false);
            }
          },
        },
      ]
    );
  };

 

  const handleCancelSentRequest = async () => {
    // Get the status id
    if (!statusDetails?.id) {
      return;
    }

    Alert.alert(
      'Cancel Accept Request',
      'Are you sure you want to cancel the accept request? This action cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await api.post(
                `/en/on/cancel/sent/request/${statusDetails.id}`,
                {},
                {
                  requiresAuth: true,
                }
              );

              // Reset states
              setIncomingProviderId(null);
              
              // Refresh status to update UI
              await checkAcceptStatus();
              
              // Show success toast
              onToast('Accept request cancelled successfully.', 'success');
              
              // Refresh to get updated request status
              onRefresh();
            } catch (err: any) {
              // Show error toast
              onToast(err?.message || 'Failed to cancel request. Please try again.', 'error');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenMap = () => {
    // TODO: Navigate to map view with customer location
    console.log('Open map view');
  };

  const handleOpenChat = () => {
    router.push({
      pathname: "/ChatRoom",
      params: {
        bookedServiceId: request.id,
      },
    });
  };

  const handleCompleteOrder = async () => {
    Alert.alert(
      'Complete Order',
      'Are you sure you want to complete this order? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete',
          onPress: async () => {
            setIsCompleting(true);
            try {
              await api.post(
                `/en/on/book/service/complete/${request.id}/request`,
                {},
                {
                  requiresAuth: true,
                }
              );

              onToast('Order completed successfully', 'success');
              onRefresh();
            } catch (err: any) {
              onToast(err?.message || 'Failed to complete order. Please try again.', 'error');
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  // Check if there are pending invoices (unpublished invoices)
  const hasPendingInvoices = invoices.some(invoice => !invoice.isPublished);
  const shouldShowCompleteButton = request.isAccepted && !hasPendingInvoices && !isLoadingInvoices;
  const shouldShowPendingInvoicesMessage = request.isAccepted && hasPendingInvoices && !isLoadingInvoices;
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {!statusCheckComplete && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary.green} />
            <Text style={styles.loadingText}>Checking status...</Text>
          </View>
        )}
        {statusCheckComplete && !request.isCompleted && (() => {
          // if (statusCheckComplete && !status) {
          //   return null;
          // }
          // Use status object to determine what to display
          const hasAcceptedStatus = statusDetails?.isAccepted === true;
          const hasStatusButNotAccepted = statusDetails && !statusDetails.isAccepted && !statusDetails.isCustomerCancelled;
          const hasNoStatus = !statusDetails;
          
          if (hasAcceptedStatus) {
            // Customer has accepted
            return (
              <View style={styles.acceptedContainer}>
                <View style={styles.acceptedInfo}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary.green} />
                  <Text style={styles.acceptedText}>Customer has accepted your request!</Text>
                </View>
              </View>
            );
          } else if (hasStatusButNotAccepted) {
            // Waiting for customer to accept
            return (
              <View style={styles.waitingContainer}>
                <View style={styles.waitingInfo}>
                  {isCheckingStatus ? (
                    <ActivityIndicator size="small" color={colors.secondary.orange} />
                  ) : (
                    <Ionicons name="time-outline" size={20} color={colors.secondary.orange} />
                  )}
                  <Text style={styles.waitingText}>Waiting for customer to accept</Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSentRequest}
                  disabled={isCancelling || !statusDetails?.id}
                  activeOpacity={0.8}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={18} color={colors.text.inverse} />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          } else if (hasNoStatus && !request.isAccepted) {
            // No status - show accept button
            return (
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptRequest}
                disabled={isAccepting}
                activeOpacity={0.8}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
                    <Text style={styles.acceptButtonText}>Accept Request</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          }
          return null;
        })()}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleOpenMap}
            activeOpacity={0.7}
          >
            <Ionicons name="map-outline" size={24} color={colors.primary.green} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleOpenChat}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.primary.green} />
          </TouchableOpacity>
        </View>

        {/* Message about pending invoices */}
        {shouldShowPendingInvoicesMessage && (
          <View style={styles.pendingInvoicesMessage}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.secondary.orange} />
            <Text style={styles.pendingInvoicesText}>
              Please publish all invoices before completing the order
            </Text>
          </View>
        )}

        {/* Complete Order Button - Only show if request is accepted and no pending invoices */}
        {shouldShowCompleteButton && !request.isCompleted && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteOrder}
            disabled={isCompleting}
            activeOpacity={0.8}
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
                <Text style={styles.completeButtonText}>Complete Order</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Message about completed order */}
      {request.isCompleted && (
        <View style={styles.completedOrderMessage}>
          <View style={styles.completedOrderIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color={colors.text.inverse} />
          </View>
          <View style={styles.completedOrderContent}>
            <Text style={styles.completedOrderTitle}>Order Completed</Text>
            <Text style={styles.completedOrderText}>This order has been successfully completed.</Text>
          </View>
        </View>
      )}

      {/* Request Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Information {statusDetails?.isAccepted }</Text>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Book Code</Text>
            <Text style={styles.infoValue}>{request.bookCode}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="time-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Booked Date</Text>
            <Text style={styles.infoValue}>{formatDateTime(request.bookedDate)}</Text>
          </View>
        </View>

        {request.acceptedDate && (
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary.green} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Accepted Date</Text>
              <Text style={styles.infoValue}>{formatDateTime(request.acceptedDate)}</Text>
            </View>
          </View>
        )}

        {request.description && (
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary.green} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{request.description}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Service Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Information</Text>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="construct-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Service Name</Text>
            <Text style={styles.infoValue}>{request.service.name}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="folder-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Service Mode</Text>
            <Text style={styles.infoValue}>{request.service.mode.name}</Text>
          </View>
        </View>

        {request.service.description && (
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary.green} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Service Description</Text>
              <Text style={styles.infoValue}>{request.service.description}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="person-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {request.customer.firstName} {request.customer.middleName} {request.customer.lastName}
            </Text>
          </View>
        </View>

        {/* <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{request.customer.email}</Text>
          </View>
        </View> */}

        {/* <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="call-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{request.customer.phone}</Text>
          </View>
        </View> */}

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="location-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Country</Text>
            <Text style={styles.infoValue}>{request.customer.country}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="id-card-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>User Number</Text>
            <Text style={styles.infoValue}>{request.customer.userNumber}</Text>
          </View>
        </View>
      </View>

      {/* Branch Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Branch Information</Text>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="business-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Branch Name</Text>
            <Text style={styles.infoValue}>{request.branch.name}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="location-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>
              {request.branch.location}, {request.branch.city}, {request.branch.stateProvince}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{request.branch.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="call-outline" size={20} color={colors.primary.green} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>{request.branch.contact}</Text>
          </View>
        </View>
      </View>

      {/* Accept Status Information */}
      {statusDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accept Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusBadgeContainer}>
                {statusDetails.isAccepted ? (
                  <View style={[styles.statusBadge, styles.statusBadgeAccepted]}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.text.inverse} />
                    <Text style={styles.statusBadgeText}>Accepted</Text>
                  </View>
                ) : statusDetails.isCustomerCancelled ? (
                  <View style={[styles.statusBadge, styles.statusBadgeCancelled]}>
                    <Ionicons name="close-circle" size={16} color={colors.text.inverse} />
                    <Text style={styles.statusBadgeText}>Customer Cancelled</Text>
                  </View>
                ) : statusDetails.isCancelled ? (
                  <View style={[styles.statusBadge, styles.statusBadgeCancelled]}>
                    <Ionicons name="close-circle" size={16} color={colors.text.inverse} />
                    <Text style={styles.statusBadgeText}>Cancelled</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.statusBadgePending]}>
                    <Ionicons name="time-outline" size={16} color={colors.text.inverse} />
                    <Text style={styles.statusBadgeText}>Pending</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.statusDetails}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Created At</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(statusDetails.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time-outline" size={18} color={colors.primary.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(statusDetails.updatedAt)}
                  </Text>
                </View>
              </View>

              {statusDetails.organization && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="business-outline" size={18} color={colors.primary.green} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Organization</Text>
                    <Text style={styles.infoValue}>
                      {statusDetails.organization.name}
                    </Text>
                  </View>
                </View>
              )}

              {statusDetails.branch && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="location-outline" size={18} color={colors.primary.green} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Branch</Text>
                    <Text style={styles.infoValue}>
                      {statusDetails.branch.name}
                    </Text>
                  </View>
                </View>
              )}

              {statusDetails.service && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="construct-outline" size={18} color={colors.primary.green} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Service</Text>
                    <Text style={styles.infoValue}>
                      {statusDetails.service.name}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Invoice Information */}

    </ScrollView>
  );
};

export default IncomingRequestDetailsTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButtonsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.green,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  acceptedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.greenLight + '20',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary.green + '40',
  },
  acceptedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptedText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.primary.green,
  },
  waitingContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary.orangeLight + '20',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary.orange + '40',
    gap: 12,
  },
  waitingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  waitingText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.secondary.orange,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.semantic.error,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.greenLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
  },
  statusHeader: {
    marginBottom: 16,
  },
  statusBadgeContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeAccepted: {
    backgroundColor: colors.primary.green,
  },
  statusBadgeCancelled: {
    backgroundColor: colors.semantic.error,
  },
  statusBadgePending: {
    backgroundColor: colors.secondary.orange,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  statusDetails: {
    gap: 12,
  },
  loadingContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.green,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    elevation: 2,
    shadowColor: colors.primary.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
  },
  pendingInvoicesMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.secondary.orangeLight + '20',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary.orange + '40',
    marginTop: 12,
  },
  pendingInvoicesText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.secondary.orange,
  },
  completedOrderMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.greenLight + '15',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary.green,
    marginBottom: 16,
    gap: 12,
    
  },
  completedOrderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  completedOrderContent: {
    flex: 1,
    gap: 4,
  },
  completedOrderTitle: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
    marginBottom: 2,
  },
  completedOrderText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

