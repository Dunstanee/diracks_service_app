import type { IncomingRequest } from '@/components/IncomingRequestsComponent';
import Skeleton from '@/components/Skeleton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import api from '@/services/api';
import { useBranchStore } from '@/store/branchStore';
import { formatDateTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const IncomingRequestList = () => {
  const { branch } = useBranchStore();
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<IncomingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIncomingRequests = useCallback(async () => {
    if (!branch?.id) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<IncomingRequest[]>(
        `/en/on/book/services/branch/${branch.id}`,
        {
          requiresAuth: true,
        }
      );

      // Filter for incoming requests (new or ongoing, not cancelled, not declined, not completed)
      const incoming = (response.data || [])
        .filter(
          (req) =>
            !req.isCancelled &&
            !req.isDeclined &&
            !req.isCompleted &&
            req.isActive
        );

      setIncomingRequests(incoming);
      setFilteredRequests(incoming);
    } catch (err: any) {
      console.error('Failed to fetch incoming requests:', err);
      setIncomingRequests([]);
      setFilteredRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [branch?.id]);

  useEffect(() => {
    fetchIncomingRequests();
  }, [fetchIncomingRequests]);

  const handleRefresh = useCallback(async () => {
    if (!branch?.id) {
      return;
    }

    setIsRefreshing(true);
    try {
      const response = await api.get<IncomingRequest[]>(
        `/en/on/book/services/branch/${branch.id}`,
        {
          requiresAuth: true,
        }
      );

      // Filter for incoming requests (new or ongoing, not cancelled, not declined, not completed)
      const incoming = (response.data || [])
        .filter(
          (req) =>
            !req.isCancelled &&
            !req.isDeclined &&
            !req.isCompleted &&
            req.isActive
        );

      setIncomingRequests(incoming);
      setFilteredRequests(incoming);
    } catch (err: any) {
      console.error('Failed to refresh incoming requests:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [branch?.id]);

  useEffect(() => {
    // Filter requests based on search query (service name)
    if (searchQuery.trim() === '') {
      setFilteredRequests(incomingRequests);
    } else {
      const filtered = incomingRequests.filter((req) =>
        req.service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRequests(filtered);
    }
  }, [searchQuery, incomingRequests]);

  const handleRequestPress = (request: IncomingRequest) => {
    router.push({
      pathname: "/IncomingRequestDetails",
      params: {
        requestId: request.id,
      },
    });
  };

  if (!branch?.id) {
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
          <Text style={styles.headerTitle}>Incoming Requests</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={48} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>No branch selected</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Incoming Requests</Text>
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
            placeholder="Search by service name..."
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

      {/* Loading State */}
      {isLoading ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <Skeleton width="100%" height={180} borderRadius={16} />
            </View>
          ))}
        </ScrollView>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={colors.neutral.gray.light} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No requests found' : 'No incoming requests'}
          </Text>
          {searchQuery && (
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary.green]}
              tintColor={colors.primary.green}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.requestCard}
              onPress={() => handleRequestPress(item)}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={require('@/assets/backgroud/incoming-background.png')}
                style={styles.requestCardBackground}
                resizeMode="cover"
              >
                <View style={styles.requestCardOverlay}>
                  <View style={styles.requestCardHeader}>
                    <View style={styles.requestBookCode}>
                      <Ionicons name="receipt-outline" size={16} color={colors.text.inverse} />
                      <Text style={styles.requestBookCodeText}>{item.bookCode}</Text>
                    </View>
                    <View
                      style={[
                        styles.requestStatusBadge,
                        item.isAccepted
                          ? item.isCompleted
                            ? styles.requestStatusBadgeCompleted
                            : styles.requestStatusBadgeOngoing
                          : item.isCompleted
                            ? styles.requestStatusBadgeCompleted
                            : styles.requestStatusBadgeNew,
                      ]}
                    >
                      <Text
                        style={[
                          styles.requestStatusBadgeText,
                          item.isAccepted
                            ? item.isCompleted
                              ? styles.requestStatusBadgeTextCompleted
                              : styles.requestStatusBadgeTextOngoing
                            : styles.requestStatusBadgeTextNew,
                        ]}
                      >
                        {item.isAccepted && !item.isCompleted ? 'Ongoing' : item.isCompleted ? 'Completed' : 'New'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestDateContainer}>
                    <View style={styles.requestDate}>
                      <Ionicons name="time-outline" size={14} color={colors.text.inverse} />
                      <Text style={styles.requestDateText}>
                        {formatDateTime(item.bookedDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestContent}>
                    <View style={styles.requestService}>
                      <Ionicons name="construct-outline" size={20} color={colors.text.inverse} />
                      <Text style={styles.requestServiceText} numberOfLines={1}>
                        {item.service.name}
                      </Text>
                    </View>

                    <View style={styles.requestCustomer}>
                      <Ionicons name="person-outline" size={18} color={colors.text.inverse} />
                      <Text style={styles.requestCustomerText} numberOfLines={1}>
                        {item.customer.firstName} {item.customer.lastName}
                      </Text>
                    </View>

                    {item.description && (
                      <View style={styles.requestDescription}>
                        <Text style={styles.requestDescriptionText} numberOfLines={2}>
                          {item.description}
                        </Text>
                      </View>
                    )}

                    <View style={styles.requestBranch}>
                      <Ionicons name="location-outline" size={16} color={colors.text.inverse} />
                      <Text style={styles.requestBranchText} numberOfLines={1}>
                        {item.branch.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestChevron}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text.inverse} />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default IncomingRequestList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    gap: 8,
  },
  listContent: {
    padding: 10,
    gap: 8,
  },
  skeletonCard: {
    marginBottom: 16,
  },
  requestCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    marginBottom: 10,
  },
  requestCardBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 180,
  },
  requestCardOverlay: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flex: 1,
    justifyContent: 'space-between',
    position: 'relative',
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestBookCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestBookCodeText: {
    fontSize: 12,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  requestStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestStatusBadgeNew: {
    backgroundColor: colors.semantic.info + 'CC',
  },
  requestStatusBadgeOngoing: {
    backgroundColor: colors.secondary.orange + 'CC',
  },
  requestStatusBadgeCompleted: {
    backgroundColor: colors.primary.green + 'CC',
  },
  requestStatusBadgeTextCompleted: {
    color: colors.text.inverse,
  },
  requestStatusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.weights.semiBold,
  },
  requestStatusBadgeTextNew: {
    color: colors.text.inverse,
  },
  requestStatusBadgeTextOngoing: {
    color: colors.text.inverse,
  },
  requestDateContainer: {
    marginBottom: 8,
  },
  requestDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestDateText: {
    fontSize: 11,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  requestContent: {
    flex: 1,
    gap: 12,
  },
  requestService: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestServiceText: {
    fontSize: 18,
    fontFamily: fonts.weights.bold,
    color: colors.text.inverse,
    flex: 1,
  },
  requestCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestCustomerText: {
    fontSize: 15,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
    flex: 1,
  },
  requestDescription: {
    marginTop: 4,
  },
  requestDescriptionText: {
    fontSize: 13,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.9,
    lineHeight: 18,
  },
  requestBranch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  requestBranchText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.inverse,
    opacity: 0.8,
    flex: 1,
  },
  requestChevron: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.neutral.gray.medium,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.light,
    marginTop: 8,
    textAlign: 'center',
  },
});
