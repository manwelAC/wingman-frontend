import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import { customerApi, gameApi, paymentMethodApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme
} from 'react-native';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  actionButtons?: Array<{
    id: string;
    label: string;
  }>;
}

interface GrindFormData {
  customer?: string;
  game?: string;
  serviceType?: string;
  paymentMethod?: string;
  startingTier?: string;
  targetTier?: string;
  accountUsername?: string;
  specialInstructions?: string;
  dueDate?: string;
}

export default function LogGrindChatScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const primaryColor = colorScheme === 'dark' ? '#00D9FF' : theme.colors.primary;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<GrindFormData>({});
  const [step, setStep] = useState<'customer' | 'game' | 'service' | 'payment' | 'tiers' | 'targetTier' | 'username' | 'review'>('customer');
  const [customers, setCustomers] = useState<Array<{ id: number; display_name: string }>>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [tierSelectionStep, setTierSelectionStep] = useState<'starting' | 'target' | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch customers on mount
  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomersLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          setCustomersError('No auth token found');
          return;
        }
        const response = await customerApi.fetchCustomers(token);
        if (response.success && response.data) {
          setCustomers(response.data);
        } else {
          setCustomersError(response.message || 'Failed to fetch customers');
        }
      } catch (error) {
        setCustomersError(error instanceof Error ? error.message : 'Error fetching customers');
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Show initial typing animation then first message
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const message: Message = {
        id: '1',
        type: 'ai',
        content: 'Hey there, Pilot! 🎮 Let\'s log a new grind. First things first - which customer is this grind for? Type their name to search:',
        timestamp: new Date(),
      };
      
      setMessages([message]);
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [customers]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const searchQuery = inputValue;
    setInputValue('');

    // Handle customer search during customer step
    if (step === 'customer') {
      setIsLoading(true);
      setTimeout(() => {
        const matchedCustomers = customers.filter((c) =>
          c.display_name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        let contentMessage = '';
        if (matchedCustomers.length === 0) {
          contentMessage = `Hmm, no customers match ${searchQuery}. Try a different name!`;
        } else if (matchedCustomers.length === 1) {
          contentMessage = `Found 1 match for ${searchQuery}:`;
        } else {
          contentMessage = `Found ${matchedCustomers.length} matches for ${searchQuery}:`;
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: contentMessage,
          timestamp: new Date(),
          actionButtons:
            matchedCustomers.length > 0
              ? matchedCustomers.map((c) => ({
                  id: c.id.toString(),
                  label: c.display_name,
                }))
              : undefined,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
    } else {
      // Other steps - simulate AI response
      setIsLoading(true);
      setTimeout(() => {
        const aiMessage = generateAIResponse(searchQuery);
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
    }

    Keyboard.dismiss();
  };

  const handleQuickReply = (buttonId: string, buttonLabel: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: buttonLabel,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Handle customer selection
    if (step === 'customer') {
      setFormData((prev) => ({ ...prev, customer: buttonLabel }));
      setStep('game');
      setIsLoading(true);
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Got it! ${buttonLabel}. Now, which game are we grinding?`,
          timestamp: new Date(),
          actionButtons: [
            { id: 'codm', label: 'CODM' },
            { id: 'mlbb', label: 'MLBB' },
            { id: 'valorant', label: 'Valorant' },
          ],
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
    }
    // Handle service type selection - fetch payment methods first
    else if (step === 'service') {
      setFormData((prev) => ({ ...prev, serviceType: buttonLabel }));
      setStep('payment');
      setIsLoading(true);
      setPaymentMethodsLoading(true);

      const fetchAndRespond = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) return;

          let typeMap: Record<number, string> = {};

          const availableRes = await paymentMethodApi.getAvailableMethods(token);
          if (availableRes.success && availableRes.data?.data) {
            const allAvailable = [
              ...(availableRes.data.data.e_wallet || []),
              ...(availableRes.data.data.bank_transfer || []),
              ...(availableRes.data.data.credit_card || []),
            ];
            setAvailableMethods(allAvailable);
            // Create a map of type ID to type name
            allAvailable.forEach((method: any) => {
              typeMap[method.id] = method.name;
            });
          }

          const userRes = await paymentMethodApi.getUserMethods(token);
          let activeMethods: any[] = [];
          if (userRes.success && userRes.data?.data) {
            const allMethods = [
              ...(userRes.data.data.e_wallet || []),
              ...(userRes.data.data.bank_transfer || []),
              ...(userRes.data.data.credit_card || []),
            ];
            activeMethods = allMethods.filter((m: any) => m.is_active);
            setPaymentMethods(activeMethods);
          }

          // Now create the message with payment method buttons
          const buttons = activeMethods.slice(0, 3).map((method: any) => {
            const methodTypeName = typeMap[method.payment_method_type_id] || 'Payment Method';
            return {
              id: method.id.toString(),
              label: methodTypeName,
            };
          });

          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: 'Great! Now, which payment method would you like to use?',
            timestamp: new Date(),
            actionButtons: buttons.length > 0 ? buttons : undefined,
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
          console.error('Error fetching payment methods:', error);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: 'Sorry, I couldn\'t load payment methods. Please try again.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
        } finally {
          setPaymentMethodsLoading(false);
        }
      };

      fetchAndRespond();
    }
    // Handle payment method selection
    else if (step === 'payment') {
      const selectedMethod = paymentMethods.find((m: any) => m.id.toString() === buttonId);
      if (selectedMethod) {
        const methodType = availableMethods.find((m) => m.id === selectedMethod.payment_method_type_id);
        setFormData((prev) => ({ ...prev, paymentMethod: methodType?.name || buttonLabel }));
        setStep('tiers');
        setIsLoading(true);
        setTiersLoading(true);

        const fetchAndDisplayTiers = async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            const response = await gameApi.fetchRankTiers(formData.game || '', token);
            if (response.success && response.data?.tiers) {
              setTiers(response.data.tiers);

              // Create tier buttons (show first 5 or all if less)
              const tierButtons = response.data.tiers.slice(0, 5).map((tier: any) => ({
                id: tier.id.toString(),
                label: tier.tier_name || tier.name,
              }));

              const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `Perfect! ${buttonLabel} it is. Now, what's your starting tier? Tap below to select.`,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, aiMessage]);
            } else {
              const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `Hmm, couldn't load tiers for ${formData.game}. Try again?`,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, aiMessage]);
            }
            setIsLoading(false);
            scrollViewRef.current?.scrollToEnd({ animated: true });
          } catch (error) {
            console.error('Error fetching tiers:', error);
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'ai',
              content: `Sorry, I couldn't load the tiers. Please try again.`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
            setIsLoading(false);
          } finally {
            setTiersLoading(false);
          }
        };

        fetchAndDisplayTiers();
      }
    } else if (step === 'tiers') {
      // Handle starting tier selection - open modal
      setTierSelectionStep('starting');
      if (tiers.length === 0) {
        // Fetch tiers if not already loaded
        const fetchTiersForModal = async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;
            const response = await gameApi.fetchRankTiers(formData.game || '', token);
            if (response.success && response.data?.tiers) {
              setTiers(response.data.tiers);
            }
          } catch (error) {
            console.error('Error fetching tiers:', error);
          }
        };
        fetchTiersForModal();
      }
      setShowTierModal(true);
    } else if (step === 'targetTier') {
      // Handle target tier selection - open modal
      setTierSelectionStep('target');
      setShowTierModal(true);
    } else {
      // Simulate AI response for other steps
      setIsLoading(true);
      setTimeout(() => {
        const aiMessage = generateAIResponseForButton(buttonId, buttonLabel);
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
    }
  };

  const generateAIResponse = (userInput: string): Message => {
    // This is just a mockup - in real implementation, this would be driven by form state
    return {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `Great! I've noted that. Now, which game are we grinding?`,
      timestamp: new Date(),
      actionButtons: [
        { id: 'codm', label: 'CODM' },
        { id: 'mlbb', label: 'MLBB' },
        { id: 'valorant', label: 'Valorant' },
      ],
    };
  };

  const generateAIResponseForButton = (buttonId: string, buttonLabel: string): Message => {
    // Handle game selection
    if (step === 'game') {
      setFormData((prev) => ({ ...prev, game: buttonLabel }));
      setStep('service');
      
      const gameResponses: Record<string, { text: string; buttons: Array<{ id: string; label: string }> }> = {
        codm: {
          text: 'Nice! CODM it is. Rank Boost or no service type?',
          buttons: [
            { id: 'rankboost', label: 'Rank Boost' },
          ],
        },
        mlbb: {
          text: 'MLBB huh? Cool choice. What service do you need?',
          buttons: [
            { id: 'rankboost', label: 'Rank Boost' },
            { id: 'stargrind', label: 'Star Grind' },
          ],
        },
        valorant: {
          text: 'Valorant! Let\'s go. What\'s the grind goal?',
          buttons: [
            { id: 'rankboost', label: 'Rank Boost' },
          ],
        },
      };
      
      const response = gameResponses[buttonId];
      return {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.text,
        timestamp: new Date(),
        actionButtons: response.buttons,
      };
    }

    // Default fallback
    return {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'Got it! What\'s next?',
      timestamp: new Date(),
    };
  };

  const handleTierSelection = (tier: any) => {
    const tierName = tier.tier_name || tier.name;
    
    if (tierSelectionStep === 'starting') {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: tierName,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setFormData((prev) => ({ ...prev, startingTier: tierName }));
      setShowTierModal(false);
      setStep('targetTier');
      setIsLoading(true);
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Great! Starting at ${tierName}. Now, what's your target tier? Tap below to select.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
    } else if (tierSelectionStep === 'target') {
      // Validate target tier > starting tier
      const startingTierObj = tiers.find((t: any) => t.tier_name === formData.startingTier);
      const startingTierOrder = startingTierObj?.tier_order || 0;
      const targetTierOrder = tier.tier_order || 0;
      
      if (targetTierOrder <= startingTierOrder) {
        // Show error in modal
        alert('Target tier must be higher than starting tier!');
        return;
      }
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: tierName,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setFormData((prev) => ({ ...prev, targetTier: tierName }));
      setShowTierModal(false);
      setStep('username');
      setIsLoading(true);
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Perfect! Grinding from ${formData.startingTier} to ${tierName}. What's the account username?`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 11,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    messageBubble: {
      marginVertical: theme.spacing.sm,
    },
    userBubble: {
      alignSelf: 'flex-end',
      maxWidth: '85%',
      backgroundColor: primaryColor,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 4,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      maxWidth: '85%',
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
      lineHeight: 18,
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
    actionButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      alignSelf: 'flex-start',
    },
    actionButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: primaryColor,
    },
    actionButtonText: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: primaryColor,
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
      backgroundColor: primaryColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      gap: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: primaryColor,
    },
    aiTyping: {
      alignSelf: 'flex-start',
      maxWidth: '85%',
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    modalContent: {
      backgroundColor: `rgba(${theme.colors.background === '#1a1a2e' ? '26, 26, 46' : '255, 255, 255'}, 0.9)`,
      borderRadius: 20,
      maxHeight: '70%',
      width: '100%',
      paddingTop: theme.spacing.lg,
      borderWidth: 1,
      borderColor: primaryColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    modalHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    tierList: {
      flex: 1,
    },
    tierItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tierItemText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
    },
    tierItemMeta: {
      fontSize: 12,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
  });

  // Typing indicator with bouncing dots
  const TypingIndicator = () => {
    const animations = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

    React.useEffect(() => {
      const createAnimation = (delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.sequence([
              Animated.timing(animations[delay / 150], {
                toValue: -8,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(animations[delay / 150], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      };

      const anim1 = createAnimation(0);
      const anim2 = createAnimation(150);
      const anim3 = createAnimation(300);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    }, []);

    return (
      <View style={styles.loadingContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                transform: [{ translateY: animations[index] }],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // Tier Selection Modal
  const TierSelectionModal = () => {
    const renderTierItem = ({ item }: { item: any }) => (
      <Pressable
        style={styles.tierItem}
        onPress={() => handleTierSelection(item)}
      >
        <View>
          <Text style={styles.tierItemText}>{item.tier_name || item.name}</Text>
          {item.rank_group && (
            <Text style={styles.tierItemMeta}>{item.rank_group}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={primaryColor} />
      </Pressable>
    );

    return (
      <Modal
        visible={showTierModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTierModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {tierSelectionStep === 'starting' ? 'Select Starting Tier' : 'Select Target Tier'}
              </Text>
            </View>
            <FlatList
              style={styles.tierList}
              data={tiers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTierItem}
              scrollEnabled
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Log Grind</Text>
            <Text style={styles.headerSubtitle}>Chat mode - Let's set up your grind</Text>
          </View>
          <Ionicons name="chatbubble" size={24} color={primaryColor} />
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

              {/* Action Buttons */}
              {message.actionButtons && message.actionButtons.length > 0 && (
                <View style={styles.actionButtons}>
                  {message.actionButtons.map((button) => (
                    <Pressable
                      key={button.id}
                      style={styles.actionButton}
                      onPress={() => handleQuickReply(button.id, button.label)}
                    >
                      <Text style={styles.actionButtonText}>{button.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.messageBubble}>
              <View style={styles.aiTyping}>
                <TypingIndicator />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {step === 'tiers' || step === 'targetTier' ? (
            <Pressable
              style={[styles.input, { justifyContent: 'center', paddingLeft: theme.spacing.lg }]}
              onPress={() => setShowTierModal(true)}
            >
              <Text style={[styles.messageText, { color: primaryColor }]}>
                {step === 'tiers' ? 'Select Starting Tier →' : 'Select Target Tier →'}
              </Text>
            </Pressable>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Type your answer..."
                placeholderTextColor={theme.colors.textSecondary}
                value={inputValue}
                onChangeText={setInputValue}
                multiline
                editable={!isLoading}
              />
              <Pressable
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
              >
                <Ionicons
                  name={isLoading ? 'hourglass' : 'send'}
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <TierSelectionModal />
      <FloatingNav />
    </SafeAreaView>
  );
}
