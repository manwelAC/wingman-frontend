import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import { calculatorApi, customerApi, gameApi, grindApi, paymentMethodApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
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
  customerId?: number;
  customer?: string;
  game?: string;
  serviceType?: string;
  paymentMethodId?: number;
  paymentMethod?: string;
  startingTierId?: number;
  startingTier?: string;
  targetTierId?: number;
  targetTier?: string;
  accountUsername?: string;
  specialInstructions?: string;
  dueDateObj?: Date | null;
  dueDate?: string;
  basePrice?: number;
  finalPrice?: number;
}

export default function LogGrindChatScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const primaryColor = colorScheme === 'dark' ? '#00D9FF' : theme.colors.primary;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<GrindFormData>({});
  const [step, setStep] = useState<'customer' | 'game' | 'service' | 'payment' | 'tiers' | 'targetTier' | 'username' | 'specialInstructions' | 'dueDate' | 'review'>('customer');
  const [customers, setCustomers] = useState<Array<{ id: number; display_name: string }>>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [tierSelectionStep, setTierSelectionStep] = useState<'starting' | 'target' | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tierPage, setTierPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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
    // Allow empty input only for specialInstructions (optional field)
    if (!inputValue.trim() && step !== 'specialInstructions') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue || '(skipped)',
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
    } else if (step === 'username') {
      // Handle username input
      setFormData((prev) => ({ ...prev, accountUsername: searchQuery }));
      setStep('specialInstructions');
      setIsLoading(true);
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Got it! Username: ${searchQuery}. Any special instructions or notes for this grind? (Optional - press send to skip)`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
    } else if (step === 'specialInstructions') {
      // Handle special instructions - can be empty
      setFormData((prev) => ({ ...prev, specialInstructions: searchQuery || 'None' }));
      setStep('dueDate');
      setIsLoading(true);
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Got it! Any due date for this grind? (Optional - press skip to continue)`,
          timestamp: new Date(),
          actionButtons: [
            { id: 'set-date', label: '📅 Set Date & Time' },
            { id: 'skip-date', label: '⏭️ Skip' },
          ],
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
      Keyboard.dismiss();
      return;
    } else if (step === 'dueDate' && inputValue.trim()) {
      // Special handling for date input - not used in chat, skip
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

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(formData.dueDateObj || new Date());
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setFormData((prev) => ({ ...prev, dueDateObj: newDate }));
      // Show time picker after date is selected
      setShowDatePicker(false);
      setTimeout(() => {
        setShowTimePicker(true);
      }, 500);
    } else {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    if (selectedTime) {
      const newDate = new Date(formData.dueDateObj || new Date());
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      const updatedFormData = { ...formData, dueDateObj: newDate };
      setFormData(updatedFormData);
      // Show confirmation message and proceed to review
      setShowTimePicker(false);
      setStep('review');
      setIsLoading(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `📅 Due date set to ${formatDueDateForDisplay(newDate)}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setTimeout(() => {
        proceedToReview(updatedFormData);
      }, 600);
    } else {
      setShowTimePicker(false);
    }
  };

  const formatDueDate = (date: Date | null) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const formatDueDateForDisplay = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const proceedToReview = async (updatedFormData: GrindFormData) => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) throw new Error('No auth token');

          // Convert service type to API format
          const serviceTypeMap: Record<string, string> = {
            'Rank Boost': 'rank_boost',
            'Win Count': 'win_count',
            'Star Grind': 'rank_boost',
          };

          const calculatorResponse = await calculatorApi.calculateRankBoost(
            {
              game: updatedFormData.game || '',
              service_type: serviceTypeMap[updatedFormData.serviceType!] || updatedFormData.serviceType || '',
              starting_tier_id: updatedFormData.startingTierId || 0,
              target_tier_id: updatedFormData.targetTierId || 0,
            },
            token
          );

          let priceDisplay = 'Calculating...';
          if (calculatorResponse.success && calculatorResponse.data) {
            const basePrice = calculatorResponse.data.base_price || 0;
            const finalPrice = calculatorResponse.data.final_price || basePrice;
            updatedFormData.basePrice = basePrice;
            updatedFormData.finalPrice = finalPrice;
            priceDisplay = `₱${finalPrice.toFixed(2)}`;
          }

          setFormData(updatedFormData);

          // Build summary with pricing and due date
          const dueDateDisplay = updatedFormData.dueDateObj ? formatDueDateForDisplay(updatedFormData.dueDateObj) : 'Not set';
          const summary = `
📋 **GRIND SUMMARY**
━━━━━━━━━━━━━━━━━
👤 Customer: ${updatedFormData.customer}
🎮 Game: ${updatedFormData.game}
⚙️ Service: ${updatedFormData.serviceType}
💳 Payment: ${updatedFormData.paymentMethod}
📊 Boost: ${updatedFormData.startingTier} → ${updatedFormData.targetTier}
👤 Username: ${updatedFormData.accountUsername}
📝 Notes: ${updatedFormData.specialInstructions}
📅 Due: ${dueDateDisplay}
💰 Price: ${priceDisplay}
━━━━━━━━━━━━━━━━━
          `.trim();

          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: summary,
            timestamp: new Date(),
            actionButtons: [
              { id: 'confirm', label: '✅ Confirm & Submit' },
              { id: 'cancel', label: '❌ Cancel' },
            ],
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
          console.error('Error calculating price:', error);
          
          // Build summary without pricing on error
          const dueDateDisplay = updatedFormData.dueDateObj ? formatDueDateForDisplay(updatedFormData.dueDateObj) : 'Not set';
          const summary = `
📋 **GRIND SUMMARY**
━━━━━━━━━━━━━━━━━
👤 Customer: ${updatedFormData.customer}
🎮 Game: ${updatedFormData.game}
⚙️ Service: ${updatedFormData.serviceType}
💳 Payment: ${updatedFormData.paymentMethod}
📊 Boost: ${updatedFormData.startingTier} → ${updatedFormData.targetTier}
👤 Username: ${updatedFormData.accountUsername}
📝 Notes: ${updatedFormData.specialInstructions}
📅 Due: ${dueDateDisplay}
━━━━━━━━━━━━━━━━━
          `.trim();

          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: summary,
            timestamp: new Date(),
            actionButtons: [
              { id: 'confirm', label: '✅ Confirm & Submit' },
              { id: 'cancel', label: '❌ Cancel' },
            ],
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
  };

  const handleQuickReply = (buttonId: string, buttonLabel: string) => {
    // Handle review confirmation
    if (buttonId === 'confirm') {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: '✅ Submitting grind...',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      
      // Call API to create grind
      const createGrind = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) {
            throw new Error('No auth token found');
          }

          // Prepare grind payload with correct structure for API
          // Convert "Rank Boost" to "rank_boost" format for API validation
          const serviceTypeMap: Record<string, string> = {
            'Rank Boost': 'rank_boost',
            'Win Count': 'win_count',
            'Star Grind': 'rank_boost', // Map to rank_boost
          };
          
          const grindPayload = {
            customer_id: formData.customerId,
            game: formData.game,
            service_type: serviceTypeMap[formData.serviceType!] || formData.serviceType,
            starting_tier_id: formData.startingTierId,
            target_tier_id: formData.targetTierId,
            account_username: formData.accountUsername,
            special_instructions: formData.specialInstructions,
            payment_method_type_id: formData.paymentMethodId,
            base_price: formData.basePrice || 0,
            final_price: formData.finalPrice || 0,
            due_date: formData.dueDateObj ? formatDueDate(formData.dueDateObj) : null,
          };

          // Log payload for debugging
          console.log('📤 Submitting grind:', grindPayload);

          // Call actual API endpoint
          const response = await grindApi.createGrind(grindPayload, token);
          
          if (!response.success) {
            throw new Error(response.message || 'Failed to create grind');
          }

          // Success response
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: `🎉 Grind logged successfully! Grind #${response.data?.grind?.grind_number}. We'll keep you updated on progress. Good luck, Pilot!`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          
          // Reset form for next grind
          setFormData({});
          setStep('customer');
          setIsLoading(false);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
          console.error('Error creating grind:', error);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: `❌ Oops! Failed to create grind. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
        }
      };

      createGrind();
      return;
    }

    if (buttonId === 'cancel') {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: 'Cancelled',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setFormData({});
      setStep('customer');
      setIsLoading(true);
      
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `No problem! Let's start over. Which customer is this grind for?`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 600);
      return;
    }

    // Handle due date buttons
    if (step === 'dueDate') {
      if (buttonId === 'set-date') {
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: '📅 Setting date and time...',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        
        // Initialize date to today if not set
        if (!formData.dueDateObj) {
          setFormData((prev) => ({ ...prev, dueDateObj: new Date() }));
        }
        setShowDatePicker(true);
        return;
      } else if (buttonId === 'skip-date') {
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: '⏭️ Skipping due date',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setStep('review');
        setIsLoading(true);
        const updatedFormData = { ...formData, dueDateObj: null };
        setFormData(updatedFormData);
        setTimeout(() => {
          proceedToReview(updatedFormData);
        }, 600);
        return;
      }
    }

    // Handle pagination buttons
    if (buttonId === '__next_page__') {
      setTierPage((prev) => prev + 1);
      setIsLoading(true);
      setTimeout(() => {
        let tiersToFilter = tiers;
        // For target tier, filter to only higher tiers
        if (step === 'targetTier' && formData.startingTier) {
          const startingTierObj = tiers.find((t: any) => t.tier_name === formData.startingTier);
          const startingTierOrder = startingTierObj?.tier_order || 0;
          tiersToFilter = tiers.filter((t: any) => t.tier_order > startingTierOrder);
        }
        
        const buttons = getTierButtonsWithPagination(tiersToFilter, tierPage + 1);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: step === 'tiers' ? 'Select your starting tier:' : 'Select your target tier:',
          timestamp: new Date(),
          actionButtons: buttons,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
      return;
    }

    if (buttonId === '__prev_page__') {
      setTierPage((prev) => Math.max(0, prev - 1));
      setIsLoading(true);
      setTimeout(() => {
        let tiersToFilter = tiers;
        // For target tier, filter to only higher tiers
        if (step === 'targetTier' && formData.startingTier) {
          const startingTierObj = tiers.find((t: any) => t.tier_name === formData.startingTier);
          const startingTierOrder = startingTierObj?.tier_order || 0;
          tiersToFilter = tiers.filter((t: any) => t.tier_order > startingTierOrder);
        }
        
        const buttons = getTierButtonsWithPagination(tiersToFilter, Math.max(0, tierPage - 1));
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: step === 'tiers' ? 'Select your starting tier:' : 'Select your target tier:',
          timestamp: new Date(),
          actionButtons: buttons,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: buttonLabel,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Handle due date buttons
    if (step === 'dueDate') {
      if (buttonId === 'set-date') {
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: '📅 Setting date and time...',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        
        // Initialize date to today if not set
        if (!formData.dueDateObj) {
          setFormData((prev) => ({ ...prev, dueDateObj: new Date() }));
        }
        setShowDatePicker(true);
        return;
      } else if (buttonId === 'skip-date') {
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: '⏭️ Skipping due date',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setStep('review');
        setIsLoading(true);
        const updatedFormData = { ...formData, dueDateObj: null };
        setFormData(updatedFormData);
        setTimeout(() => {
          proceedToReview(updatedFormData);
        }, 600);
        return;
      }
    }

    // Handle tier selection (starting or target)
    if (step === 'tiers' || step === 'targetTier') {
      const selectedTier = tiers.find((t: any) => t.id.toString() === buttonId);
      if (selectedTier) {
        // Determine which tier selection step we're on
        const tierStep = step === 'tiers' ? 'starting' : 'target';
        handleTierSelection(selectedTier, tierStep);
        return;
      }
    }

    // Handle customer selection
    if (step === 'customer') {
      setFormData((prev) => ({ 
        ...prev, 
        customerId: parseInt(buttonId),
        customer: buttonLabel 
      }));
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
        setFormData((prev) => ({ 
          ...prev, 
          paymentMethodId: selectedMethod.payment_method_type_id,
          paymentMethod: methodType?.name || buttonLabel 
        }));
        setStep('tiers');
        setIsLoading(true);
        setTiersLoading(true);

        const fetchAndDisplayTiers = async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            console.log('🔍 Fetching tiers for game:', selectedGame);
            const response = await gameApi.fetchRankTiers(selectedGame || '', token);
            console.log('📡 Tiers API response:', response.success, response.data?.tiers?.length || 0, 'tiers');
            if (response.success && response.data?.tiers) {
              setTiers(response.data.tiers);
              setTierPage(0);

              const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `Perfect! ${buttonLabel} it is. Now, what's your starting tier?`,
                timestamp: new Date(),
                actionButtons: getTierButtonsWithPagination(response.data.tiers, 0),
              };
              setMessages((prev) => [...prev, aiMessage]);
            } else {
              const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `Hmm, couldn't load tiers for ${selectedGame}. Try again?`,
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
      // Handle starting tier selection - show tiers in chat
      setTierSelectionStep('starting');
      setTierPage(0);
      if (tiers.length === 0) {
        // Fetch tiers if not already loaded
        const fetchTiersForChat = async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;
            const response = await gameApi.fetchRankTiers(selectedGame || '', token);
            if (response.success && response.data?.tiers) {
              setTiers(response.data.tiers);
            }
          } catch (error) {
            console.error('Error fetching tiers:', error);
          }
        };
        fetchTiersForChat();
      }
      setIsLoading(true);
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Perfect! Now select your starting tier:`,
          timestamp: new Date(),
          actionButtons: getTierButtonsWithPagination(tiers, 0),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } else if (step === 'targetTier') {
      // Handle target tier selection - show tiers in chat
      setTierSelectionStep('target');
      setTierPage(0);
      setIsLoading(true);
      setTimeout(() => {
        // Filter tiers to only show those higher than starting tier
        const startingTierObj = tiers.find((t: any) => t.tier_name === formData.startingTier);
        const startingTierOrder = startingTierObj?.tier_order || 0;
        const filteredTiers = tiers.filter((t: any) => t.tier_order > startingTierOrder);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Now select your target tier:`,
          timestamp: new Date(),
          actionButtons: getTierButtonsWithPagination(filteredTiers, 0),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
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

  const getTierButtonsWithPagination = (tiersArray: any[], page: number = 0) => {
    const TIERS_PER_PAGE = 5;
    const totalPages = Math.ceil(tiersArray.length / TIERS_PER_PAGE);
    const startIdx = page * TIERS_PER_PAGE;
    const endIdx = startIdx + TIERS_PER_PAGE;
    const paginatedTiers = tiersArray.slice(startIdx, endIdx);
    
    const buttons = paginatedTiers.map((tier: any) => ({
      id: tier.id.toString(),
      label: tier.tier_name || tier.name,
    }));
    
    // Add pagination buttons
    if (page > 0) {
      buttons.unshift({ id: '__prev_page__', label: '← Prev' });
    }
    
    if (page < totalPages - 1) {
      buttons.push({ id: '__next_page__', label: 'Next →' });
    }
    
    return buttons;
  };

  const generateAIResponseForButton = (buttonId: string, buttonLabel: string): Message => {
    // Handle game selection
    if (step === 'game') {
      setFormData((prev) => ({ ...prev, game: buttonLabel }));
      setSelectedGame(buttonLabel);
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

  const handleTierSelection = (tier: any, tierStep: 'starting' | 'target') => {
    const tierName = tier.tier_name || tier.name;
    
    if (tierStep === 'starting') {
      setFormData((prev) => ({ 
        ...prev, 
        startingTierId: tier.id,
        startingTier: tierName 
      }));
      setTierSelectionStep('starting');
      setStep('targetTier');
      setTierPage(0);
      setIsLoading(true);
      setTimeout(() => {
        const filteredTiers = tiers.filter((t: any) => t.tier_order > tier.tier_order);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Great! Starting at ${tierName}. Now, what's your target tier?`,
          timestamp: new Date(),
          actionButtons: getTierButtonsWithPagination(filteredTiers, 0),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } else if (tierStep === 'target') {
      // Validate target tier > starting tier
      const startingTierObj = tiers.find((t: any) => t.tier_name === formData.startingTier);
      const startingTierOrder = startingTierObj?.tier_order || 0;
      const targetTierOrder = tier.tier_order || 0;
      
      if (targetTierOrder <= startingTierOrder) {
        // Show error message in chat
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Target tier must be higher than starting tier! Please select again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        return;
      }
      
      setFormData((prev) => ({ 
        ...prev, 
        targetTierId: tier.id,
        targetTier: tierName 
      }));
      setTierSelectionStep('target');
      setStep('username');
      setTierPage(0);
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
      }, 300);
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
      maxHeight: '80%',
      width: '100%',
      borderWidth: 1,
      borderColor: primaryColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
      overflow: 'hidden',
    },
    modalHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
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
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dueDateObj || new Date()}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={formData.dueDateObj || new Date()}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          is24Hour={false}
        />
      )}

      <FloatingNav />
    </SafeAreaView>
  );
}
