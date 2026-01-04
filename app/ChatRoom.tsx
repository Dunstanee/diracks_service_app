import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { fonts } from "../constants/fonts";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useUserStore } from "../store/userStore";
import { formatTime } from "../utils/date";

interface BookedService {
  id: string;
  bookCode: string;
  isCompleted: boolean;
  isActive: boolean;
  customer: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: number; // 1 = male, 2 = female, 3 = other
  };
}

const ChatRoom = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuthStore();
  const { user } = useUserStore();
  const bookedServiceId = params.bookedServiceId as string;
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    senderId: string;
    timestamp: string;
    type: string;
    status?: "sending" | "sent" | "failed";
    tempId?: string; // For tracking optimistic messages
  }>>([]);
  const [bookedService, setBookedService] = useState<BookedService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const pendingMessagesRef = useRef<Map<string, { tempId: string; messageData: any }>>(new Map());

  // Get customer name and gender
  const customerName = bookedService
    ? `${bookedService.customer.firstName} ${bookedService.customer.lastName}`.trim()
    : "";
  const isFemale = bookedService?.customer.gender === 2;
  const profileImage = isFemale
    ? require("../assets/images/female_profile.png")
    : require("../assets/images/male_profile.png");

  const hasMessages = messages.length > 0;
  
  // Check if chatting is allowed (only if order is not completed and is active)
  const canChat = bookedService ? !bookedService.isCompleted && bookedService.isActive : false;

  // Fetch booked service details
  useEffect(() => {
    const fetchBookedService = async () => {
      if (!bookedServiceId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get<BookedService>(
          `/en/on/book/service/request/${bookedServiceId}`,
          {
            requiresAuth: true,
          }
        );
        setBookedService(response.data);
      } catch (err: any) {
        console.error("Failed to fetch booked service:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookedService();
  }, [bookedServiceId]);

  // Set up WebSocket connection
  useEffect(() => {
    if (!bookedService?.bookCode || !token || !user?.id) {
      return;
    }

    const API_DOMAIN = Constants.expoConfig?.extra?.apiDomain as string | undefined || "";
    if (!API_DOMAIN) {
      console.error("API_DOMAIN is not set");
      return;
    }

    // Convert http/https to ws/wss
    let wsUrl = API_DOMAIN;
    if (wsUrl.startsWith("https://")) {
      wsUrl = wsUrl.replace("https://", "wss://");
    } else if (wsUrl.startsWith("http://")) {
      wsUrl = wsUrl.replace("http://", "ws://");
    } else {
      // If no protocol, assume wss for production
      wsUrl = `wss://${wsUrl}`;
    }

    const wsEndpoint = `/skt/ws/service/${bookedService.bookCode}?token=${token}`;
    const wsFullUrl = `${wsUrl}${wsEndpoint}`;

    console.log("Connecting to WebSocket:", wsFullUrl.replace(token, "***"));

    setIsConnecting(true);
    const ws = new WebSocket(wsFullUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle message confirmation (when server confirms our sent message)
        if (data.type === "MESSAGE_CONFIRMED" || data.messageId) {
          // Update pending message status to "sent"
          setMessages((prev) =>
            prev.map((msg) => {
              // Match by tempId or check if this is a confirmation for a pending message
              if (msg.status === "sending" && data.messageId) {
                return { ...msg, status: "sent", id: data.messageId };
              }
              return msg;
            })
          );
          return;
        }

        // Handle incoming messages - only show messages from current user or customer
        if (data.type === "MESSAGE" || data.type === "message" || data.content || data.text) {
          const messageSenderId = data.senderId;
          const currentUserId = user.id;
          const customerId = bookedService.customer.id;
          const isFromCurrentUser = messageSenderId === currentUserId;
          const isFromCustomer = messageSenderId === customerId;

          // Only process messages from current user or customer
          if (isFromCurrentUser || isFromCustomer) {
            const messageContent = data.content || data.text || data.message || "";

            // If message is from current user, check if we already have it (optimistic update)
            if (isFromCurrentUser) {
              setMessages((prev) => {
                // Check if we already have this message (by content and senderId)
                const existingMessage = prev.find(
                  (msg) =>
                    msg.senderId === currentUserId &&
                    msg.content === messageContent &&
                    (msg.status === "sending" || msg.status === "sent")
                );

                if (existingMessage) {
                  // Update existing optimistic message with server data
                  return prev.map((msg) =>
                    msg.id === existingMessage.id || msg.tempId === existingMessage.tempId
                      ? {
                        ...msg,
                        id: data.id || msg.id,
                        status: "sent" as const,
                        timestamp: data.timestamp ? formatTime(data.timestamp) : msg.timestamp,
                      }
                      : msg
                  );
                }

                // If no existing message, add it (shouldn't happen, but just in case)
                return [
                  ...prev,
                  {
                    id: data.id || Date.now().toString(),
                    content: messageContent,
                    senderId: messageSenderId,
                    timestamp: data.timestamp ? formatTime(data.timestamp) : new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    type: data.type || "MESSAGE",
                    status: "sent" as const,
                  },
                ];
              });
            } else {
              // Message from customer - always add (new message)
              const newMessage = {
                id: data.id || Date.now().toString(),
                content: messageContent,
                senderId: messageSenderId,
                timestamp: data.timestamp || new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                type: data.type || "MESSAGE",
              };
              setMessages((prev) => [...prev, newMessage]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnecting(false);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnecting(false);
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [bookedService?.bookCode, bookedService?.customer.id, token, user?.id]);

  const handleSendMessage = () => {
    // Prevent sending if order is completed or inactive
    if (!canChat) {
      return;
    }
    
    if (message.trim() && user?.id) {
      const messageContent = message.trim();
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Optimistically add message with "sending" status
      const optimisticMessage = {
        id: tempId,
        content: messageContent,
        senderId: user.id,
        timestamp,
        type: "MESSAGE",
        status: "sending" as const,
        tempId,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setMessage("");

      // Scroll to bottom
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

      // Try to send via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const messageData = {
          type: "MESSAGE",
          receiverId: bookedService?.customer.id,
          content: messageContent,
          bookCode: bookedService?.bookCode,
          bookServiceId: bookedService?.id,
          senderId: user.id,
        };

        // Store pending message for confirmation
        pendingMessagesRef.current.set(tempId, { tempId, messageData });

        try {
          wsRef.current.send(JSON.stringify(messageData));

          // Update status to "sent" after a short delay (assuming success)
          // In production, this should be updated when server confirms
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.tempId === tempId ? { ...msg, status: "sent" } : msg
              )
            );
            pendingMessagesRef.current.delete(tempId);
          }, 500);
        } catch (error) {
          // Mark as failed if send fails
          setMessages((prev) =>
            prev.map((msg) =>
              msg.tempId === tempId ? { ...msg, status: "failed" } : msg
            )
          );
          pendingMessagesRef.current.delete(tempId);
        }
      } else {
        // WebSocket not open, mark as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: "failed" } : msg
          )
        );
      }
    }
  };

  const handleRetryMessage = (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (!message || !user?.id) return;

    // Update status to sending
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "sending" } : msg
      )
    );

    // Try to send again
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageData = {
        type: "MESSAGE",
        receiverId: bookedService?.customer.id,
        content: message.content,
        bookCode: bookedService?.bookCode,
        bookServiceId: bookedService?.id,
        senderId: user.id,
      };

      const tempId = message.tempId || messageId;
      pendingMessagesRef.current.set(tempId, { tempId, messageData });

      try {
        wsRef.current.send(JSON.stringify(messageData));
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, status: "sent" } : msg
            )
          );
          pendingMessagesRef.current.delete(tempId);
        }, 500);
      } catch (error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: "failed" } : msg
          )
        );
        pendingMessagesRef.current.delete(tempId);
      }
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "failed" } : msg
        )
      );
    }
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Listen to keyboard show/hide events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        isKeyboardVisible && { paddingBottom: Math.max(insets.bottom, 40) }
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary.green} />
          ) : (
            <>
              <Text style={styles.headerName}>{customerName || "Loading..."}</Text>
              {bookedService?.bookCode && (
                <Text style={styles.bookCodeText}>{bookedService.bookCode}</Text>
              )}
              {isConnecting && (
                <Text style={styles.connectingText}>Connecting...</Text>
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.headerAvatarButton}>
          <Image source={profileImage} style={styles.headerAvatar} />
        </TouchableOpacity>
      </View>

      <View style={styles.keyboardView}>
        {/* Content Area */}
        {hasMessages ? (
          // Messages View
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: true });
              }
            }}
          >
            {messages
              .filter((msg) => {
                // Only show messages from current user or customer
                return msg.senderId === user?.id || msg.senderId === bookedService?.customer.id;
              })
              .map((msg) => {
                const isMyMessage = msg.senderId === user?.id;
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      isMyMessage ? styles.myMessage : styles.otherMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMyMessage
                          ? styles.myMessageText
                          : styles.otherMessageText,
                      ]}
                    >
                      {msg.content || ""}
                    </Text>
                    <View style={styles.messageFooter}>
                      <Text
                        style={[
                          styles.messageTime,
                          isMyMessage
                            ? styles.myMessageTime
                            : styles.otherMessageTime,
                        ]}
                      >
                        {typeof msg.timestamp === 'string' && (msg.timestamp.includes('T') || msg.timestamp.includes('Z')) 
                          ? formatTime(msg.timestamp) 
                          : msg.timestamp}
                      </Text>
                      {isMyMessage && (
                        <View style={styles.messageStatus}>
                          {msg.status === "sending" && (
                            <ActivityIndicator
                              size="small"
                              color={isMyMessage ? colors.text.inverse : colors.text.secondary}
                              style={styles.statusIcon}
                            />
                          )}
                          {msg.status === "sent" && (
                            <Ionicons
                              name="checkmark-done"
                              size={16}
                              color={isMyMessage ? colors.text.inverse : colors.text.secondary}
                              style={styles.statusIcon}
                            />
                          )}
                          {msg.status === "failed" && (
                            <TouchableOpacity
                              onPress={() => handleRetryMessage(msg.id)}
                              style={styles.retryButton}
                            >
                              <Ionicons
                                name="refresh"
                                size={16}
                                color={colors.semantic.error}
                                style={styles.statusIcon}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
          </ScrollView>
        ) : (
          // Default/Empty State
          <ScrollView
            style={styles.emptyContainer}
            contentContainerStyle={styles.emptyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.emptyState}>
              {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary.green} />
              ) : (
                <>
                  <Image source={profileImage} style={styles.largeAvatar} />
                  <Text style={styles.emptyStateName}>{customerName || "Customer"}</Text>
                </>
              )}

              <View style={styles.securityInfoBox}>
                <View style={styles.securityInfoRow}>
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={colors.text.secondary}
                  />
                  <Text style={styles.securityInfoText}>
                    Messages are end-to-end encrypted
                  </Text>
                </View>
                <Text style={styles.securityInfoSubtext}>
                  and only visible within this chat.
                </Text>
                <Text style={styles.securityInfoSubtext}>
                  Payments use a public blockchain.
                </Text>
                <Text style={styles.securityInfoSubtext}>Secured by XMTP</Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Message Input Bar - Always on top of keyboard */}
      {!canChat && (
        <View style={styles.closedOrderBanner}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.semantic.warning} />
          <Text style={styles.closedOrderText}>This order has been closed. You can view previous messages but cannot send new ones.</Text>
        </View>
      )}

      <View style={[
        styles.inputContainer, 
        { 
          paddingBottom: Math.max(insets.bottom, 8),
          opacity: canChat ? 1 : 0.5,
        }
      ]}>
        <TouchableOpacity 
          style={styles.attachButton}
          disabled={!canChat}
        >
          <Ionicons name="add" size={24} color={canChat ? colors.text.primary : colors.neutral.gray.medium} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="happy-outline"
            size={20}
            color={canChat ? colors.neutral.gray.medium : colors.neutral.gray.light}
            style={styles.emojiIcon}
          />
          <TextInput
            style={styles.messageInput}
            placeholder={canChat ? "Message" : "Order closed"}
            placeholderTextColor={colors.neutral.gray.medium}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            editable={canChat}
          />
        </View>

        {message.trim() && canChat && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Ionicons name="send" size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
    backgroundColor: colors.background.primary,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.neutral.gray.lightest,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerName: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  bookCodeText: {
    fontSize: 11,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  connectingText: {
    fontSize: 11,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerAvatarButton: {
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
  // Empty State Styles
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  emptyStateName: {
    fontSize: 24,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 32,
  },
  securityInfoBox: {
    backgroundColor: colors.neutral.gray.lightest,
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  securityInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  securityInfoText: {
    fontSize: 14,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    textAlign: "center",
  },
  securityInfoSubtext: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: 4,
  },
  // Messages State Styles
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary.green,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.neutral.gray.lightest,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: colors.text.inverse,
  },
  otherMessageText: {
    color: colors.text.primary,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: fonts.weights.regular,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: colors.text.inverse,
    opacity: 0.8,
  },
  otherMessageTime: {
    color: colors.text.secondary,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  messageStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginLeft: 2,
  },
  retryButton: {
    padding: 2,
  },
  // Closed Order Banner
  closedOrderBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.semantic.warning + '15',
    borderTopWidth: 1,
    borderTopColor: colors.semantic.warning + '40',
    gap: 8,
  },
  closedOrderText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.weights.medium,
    color: colors.semantic.warning,
    lineHeight: 18,
  },
  // Input Bar Styles
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
    backgroundColor: colors.background.primary,
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.gray.lightest,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.gray.lightest,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  emojiIcon: {
    marginRight: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
    paddingVertical: 0,
    maxHeight: 84,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.green,
    alignItems: "center",
    justifyContent: "center",
  },
});
