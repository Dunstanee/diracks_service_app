import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constants/colors";
import { fonts } from "../../constants/fonts";
import api from "../../services/api";

// Format date for chat list display
const formatChatDate = (timestamp: number): string => {
  const now = new Date();
  const messageDate = new Date(timestamp * 1000);
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Just now (less than 1 minute)
  if (diffInSeconds < 60) {
    return "now";
  }

  // Minutes ago (less than 1 hour)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  // Hours ago (less than 24 hours)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear()
  ) {
    return "yesterday";
  }

  // This year - show "23 Oct" format
  if (messageDate.getFullYear() === now.getFullYear()) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = messageDate.getDate();
    const month = months[messageDate.getMonth()];
    return `${day} ${month}`;
  }

  // Last year or older - show "23 Oct 2023" format
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = messageDate.getDate();
  const month = months[messageDate.getMonth()];
  const year = messageDate.getFullYear();
  return `${day} ${month} ${year}`;
};

interface BookedService {
  id: string;
  bookCode: string;
  description: string;
  bookedDate: number;
  customer: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: number; // 1 = male, 2 = female, 3 = other
  };
  service: {
    id: string;
    name: string;
  };
}

const Chats = () => {
  const router = useRouter();
  const [bookedServices, setBookedServices] = useState<BookedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBookedServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<BookedService[]>(
        "/en/on/my/book/service/staff",
        {
          requiresAuth: true,
        }
      );
      setBookedServices(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch booked services:", err);
      setBookedServices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookedServices();
  }, [fetchBookedServices]);

  const handleChatPress = (bookedService: BookedService) => {
    router.push({
      pathname: "/ChatRoom",
      params: {
        bookedServiceId: bookedService.id,
      },
    });
  };

  const getCustomerName = (customer: BookedService["customer"]) => {
    return `${customer.firstName} ${customer.lastName}`.trim();
  };

  const getProfileImage = (gender: number) => {
    return gender === 2
      ? require("../../assets/images/female_profile.png")
      : require("../../assets/images/male_profile.png");
  };

  const filteredServices = bookedServices.filter((service) => {
    if (!searchQuery.trim()) return true;
    const customerName = getCustomerName(service.customer).toLowerCase();
    const bookCode = service.bookCode.toLowerCase();
    const serviceName = service.service.name.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      customerName.includes(query) ||
      bookCode.includes(query) ||
      serviceName.includes(query)
    );
  });
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="expand" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Chat</Text>

          <TouchableOpacity style={styles.avatarButton}>
            <Image
              source={require("../../assets/images/male_profile.png")}
              style={styles.headerAvatar}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.neutral.gray.medium} />
            <TextInput
              placeholder="Search by name, book code, or service"
              placeholderTextColor={colors.neutral.gray.medium}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Chat List */}
        <View style={styles.section}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.green} />
              <Text style={styles.loadingText}>Loading chats...</Text>
            </View>
          ) : filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.neutral.gray.light} />
              <Text style={styles.emptyText}>
                {searchQuery ? "No chats found" : "No chats yet"}
              </Text>
            </View>
          ) : (
            filteredServices.map((service) => {
              const customerName = getCustomerName(service.customer);
              const profileImage = getProfileImage(service.customer.gender);
              const formattedDate = formatChatDate(service.bookedDate);
              const hasNewMessage = false; // TODO: Implement new message detection

              return (
                <TouchableOpacity
                  key={service.id}
                  style={styles.chatItem}
                  onPress={() => handleChatPress(service)}
                >
                  <View style={styles.chatItemLeft}>
                    {/* Profile Avatar */}
                    <View style={styles.avatarContainer}>
                      <Image
                        source={profileImage}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                      {hasNewMessage && <View style={styles.newMessageBadge} />}
                    </View>

                    <View style={styles.chatItemContent}>
                      <View style={styles.chatItemHeader}>
                        <Text style={styles.chatUsername} numberOfLines={1}>
                          {customerName}
                        </Text>
                        {hasNewMessage && (
                          <View style={styles.badgeContainer}>
                            <View style={styles.newBadge}>
                              <Text style={styles.badgeText}>New</Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <Text style={styles.chatBookCode} numberOfLines={1}>
                        {service.bookCode}
                      </Text>
                      <Text style={styles.chatServiceName} numberOfLines={1}>
                        {service.service.name}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.chatItemRight}>
                    <Text style={styles.chatDate}>{formattedDate}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {/* <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={colors.text.inverse} />
      </TouchableOpacity> */}
    </View>
  );
};

export default Chats;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.gray.lightest,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  chatItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  chatUsername: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  chatLastMessage: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  chatItemRight: {
    alignItems: "flex-end",
  },
  chatDate: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
    marginBottom: 4,
  },
  chatBookCode: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  chatServiceName: {
    fontSize: 13,
    fontFamily: fonts.weights.medium,
    color: colors.primary.green,
  },
  newMessageBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.semantic.error,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  newBadge: {
    backgroundColor: colors.semantic.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.inverse,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.green,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: colors.primary.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
