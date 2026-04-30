import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  visible: boolean;
  onClose: () => void;
}

export default function AIChat({ visible, onClose }: AIChatProps) {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hey Pilot! 👋 I\'m your AI assistant. I can help you track grinds, manage pricing, and answer questions about your business.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);

      // Scroll to bottom
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 800);

    Keyboard.dismiss();
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('hello') || input.includes('hi')) {
      return 'Hello! How can I assist you with your grinds today?';
    }
    if (input.includes('grind') || input.includes('status')) {
      return 'You can view all your grinds in the Grinds tab. Would you like help with a specific grind?';
    }
    if (input.includes('price') || input.includes('pricing')) {
      return 'Pricing management is available in the Pricing tab. You can set up custom pricing ranges for different services there.';
    }
    if (input.includes('customer')) {
      return 'Customer management is in the Customers tab. You can add, edit, and manage customer information there.';
    }
    if (input.includes('help')) {
      return 'I can help you with: managing grinds, pricing setup, customer management, and general questions about your business. What would you like to know?';
    }

    return `Got it! "${userInput}". I'm learning from your requests. Is there anything specific I can help you with regarding your grinds or customers?`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: '85%',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    messageBubble: {
      marginVertical: theme.spacing.sm,
      maxWidth: '85%',
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 4,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    messageText: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    timestamp: {
      fontSize: 10,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    userTimestamp: {
      color: 'rgba(255,255,255,0.7)',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontFamily: 'DMMono',
      fontSize: 13,
      color: theme.colors.textPrimary,
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
    },
    aiTyping: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
              opacity: scaleAnim,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: theme.colors.textSecondary, marginTop: 2 }}>
                Always here to help
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((message) => (
              <View key={message.id} style={styles.messageBubble}>
                <View style={message.type === 'user' ? styles.userBubble : styles.aiBubble}>
                  <Text style={[styles.messageText, message.type === 'user' && styles.userMessageText]}>
                    {message.content}
                  </Text>
                  <Text style={[styles.timestamp, message.type === 'user' && styles.userTimestamp]}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageBubble, { marginVertical: theme.spacing.md }]}>
                <View style={styles.aiTyping}>
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              editable={!isLoading}
            />
            <Pressable style={styles.sendButton} onPress={handleSendMessage} disabled={isLoading}>
              <Ionicons
                name={isLoading ? 'hourglass' : 'send'}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
