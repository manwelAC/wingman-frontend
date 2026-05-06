import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, View, useColorScheme } from 'react-native';
import AIChat from './AIChat';

interface NavItem {
  label: string;
  icon: string;
  href?: "/(tabs)" | "/(tabs)/grinds" | "/(tabs)/log-grind" | "/(tabs)/customers" | "/(tabs)/pricing-setup" | "/(tabs)/wallet" | "/(tabs)/profile" | "/(tabs)/payment-methods";
  action?: 'ai-chat';
}

type NavPosition = 'default' | 'left' | 'right';

const navItems: NavItem[] = [
  // Inner layer (4 items)
  { label: 'Home', icon: 'home', href: '/(tabs)' },
  { label: 'Grinds', icon: 'reader', href: '/(tabs)/grinds' },
  { label: 'Log', icon: 'game-controller', href: '/(tabs)/log-grind' },
  { label: 'Customers', icon: 'person-add', href: '/(tabs)/customers' },
  // Outer layer (5 items) - aligned with gaps and specific inner items
  { label: 'Pricing', icon: 'pricetag', href: '/(tabs)/pricing-setup' },
  { label: 'AI Chat', icon: 'chatbubble', action: 'ai-chat' },
  { label: 'Wallet', icon: 'wallet', href: '/(tabs)/wallet' },
  { label: 'Profile', icon: 'person-circle', href: '/(tabs)/profile' },
  { label: 'Payment', icon: 'card', href: '/(tabs)/payment-methods' },
];

interface FloatingNavProps {
  navPosition?: NavPosition;
}

export default function FloatingNav({ navPosition: propNavPosition }: FloatingNavProps) {
  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const primaryColor = colorScheme === 'dark' ? '#00D9FF' : theme.colors.primary;
  const [showMenu, setShowMenu] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [navPosition, setNavPosition] = useState<NavPosition>(propNavPosition || 'default');
  const [menuAngles, setMenuAngles] = useState({ startAngle: Math.PI, endAngle: 2 * Math.PI });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const positionX = useRef(new Animated.Value(Dimensions.get('window').width / 2 - 32)).current;
  const positionY = useRef(new Animated.Value(Dimensions.get('window').height - 88)).current;
  const startXRef = useRef(Dimensions.get('window').width / 2 - 32);
  const startYRef = useRef(Dimensions.get('window').height - 88);
  const isDragging = useRef(false);
  const dragStartTime = useRef(0);
  
  // Create animations for each nav item - regenerate if navItems length changes
  const itemAnims = useMemo(
    () =>
      navItems.map(() => ({
        scale: new Animated.Value(0),
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
      })),
    [navItems.length]
  );

  useEffect(() => {
    loadNavPosition();
  }, []);

  // Update position if prop changes (from parent)
  useEffect(() => {
    if (propNavPosition) {
      setNavPosition(propNavPosition);
    }
  }, [propNavPosition]);

  useFocusEffect(
    React.useCallback(() => {
      // Reload position whenever screen comes into focus
      loadNavPosition();
    }, [])
  );

  // Create PanResponder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = false;
        dragStartTime.current = Date.now();
        // Capture current position when drag starts
        positionX.flattenOffset();
        positionY.flattenOffset();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDragging.current = true;
        }
        positionX.setValue(startXRef.current + gestureState.dx);
        positionY.setValue(startYRef.current + gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const dragDuration = Date.now() - dragStartTime.current;
        
        // If it's a quick tap (not a drag), toggle menu
        if (!isDragging.current && dragDuration < 300) {
          handleLogPressIn();
        }
        
        // Update the ref positions for the next drag
        startXRef.current += gestureState.dx;
        startYRef.current += gestureState.dy;
      },
    })
  ).current;

  const loadNavPosition = async () => {
    try {
      const position = await AsyncStorage.getItem('navPosition');
      if (position && ['default', 'left', 'right'].includes(position)) {
        setNavPosition(position as NavPosition);
      }
    } catch (error) {
      console.warn('Failed to load nav position:', error);
    }
  };

  // Determine active tab based on current route
  const currentRoute = segments && segments[1] ? `/(tabs)/${segments[1]}`.replace(/\/$/, '') : '/(tabs)';
  const activeIndex = navItems.findIndex(
    (item) => item.href && (item.href === '/(tabs)' && currentRoute === '/(tabs)/'
      ? true
      : item.href === currentRoute)
  );

  const handleLogPressIn = () => {
    // Toggle menu on click
    if (!showMenu) {
      openMenu();
    } else {
      closeMenu();
    }
  };

  const openMenu = () => {
    setShowMenu(true);
    fadeAnim.setValue(0);
    
    // Get current button position to determine where to expand the menu
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    // Calculate current position by extracting from animated value
    let currentX = startXRef.current;
    let currentY = startYRef.current;
    
    // Determine which side of screen the button is on
    const isLeftSide = currentX < screenWidth / 3;
    const isRightSide = currentX > (2 * screenWidth) / 3;
    const isTopSide = currentY < screenHeight / 3;
    const isBottomSide = currentY > (2 * screenHeight) / 3;
    
    // Determine angle range based on button position
    let startAngle = 0;
    let endAngle = 2 * Math.PI;
    
    if (isBottomSide) {
      // Bottom: show semicircle above
      startAngle = Math.PI;
      endAngle = 2 * Math.PI;
    } else if (isTopSide) {
      // Top: show semicircle below
      startAngle = 0;
      endAngle = Math.PI;
    } else if (isLeftSide) {
      // Left: show items spreading right
      startAngle = -Math.PI / 2;
      endAngle = Math.PI / 2;
    } else if (isRightSide) {
      // Right: show items spreading left
      startAngle = Math.PI / 2;
      endAngle = (3 * Math.PI) / 2;
    } else {
      // Center: default behavior
      startAngle = Math.PI;
      endAngle = 2 * Math.PI;
    }
    
    // Save the angles for rendering
    setMenuAngles({ startAngle, endAngle });
    
    // Animate items in arc
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      ...itemAnims.map((anim, index) => {
        const ratio = navItems.length > 1 ? index / (navItems.length - 1) : 0;
        const angle = startAngle + (endAngle - startAngle) * ratio;
        
        return Animated.spring(anim.scale, {
          toValue: 1,
          useNativeDriver: true,
        });
      }),
      ...itemAnims.map((anim, index) => {
        // Inner 4 items (0-3), outer 5 items (4-8)
        const isInnerLayer = index < 4;
        let ratio: number;
        
        if (isInnerLayer) {
          // Inner items at 0, 1/3, 2/3, 1
          ratio = index / 3;
        } else {
          // Outer items at 1/6, 2/6, 3/6, 4/6, 5/6
          const outerIndex = index - 4;
          ratio = (outerIndex + 1) / 6;
        }
        
        const angle = startAngle + (endAngle - startAngle) * ratio;
        const isSpecialOuterItem = index === 5 || index === 7; // AI Chat or Profile
        const radius = isInnerLayer ? 70 : (isSpecialOuterItem ? 140 : 120);
        const x = Math.cos(angle) * radius;
        
        return Animated.spring(anim.translateX, {
          toValue: x,
          useNativeDriver: true,
        });
      }),
      ...itemAnims.map((anim, index) => {
        // Inner 4 items (0-3), outer 5 items (4-8)
        const isInnerLayer = index < 4;
        let ratio: number;
        
        if (isInnerLayer) {
          // Inner items at 0, 1/3, 2/3, 1
          ratio = index / 3;
        } else {
          // Outer items at 1/6, 2/6, 3/6, 4/6, 5/6
          const outerIndex = index - 4;
          ratio = (outerIndex + 1) / 6;
        }
        
        const angle = startAngle + (endAngle - startAngle) * ratio;
        const isSpecialOuterItem = index === 5 || index === 7; // AI Chat or Profile
        const radius = isInnerLayer ? 70 : (isSpecialOuterItem ? 140 : 120);
        const y = Math.sin(angle) * radius;
        
        return Animated.spring(anim.translateY, {
          toValue: y,
          useNativeDriver: true,
        });
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      ...itemAnims.map((anim) =>
        Animated.spring(anim.scale, {
          toValue: 0,
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      setShowMenu(false);
    });
  };

  const handleItemPress = (item: NavItem) => {
    closeMenu();
    if (item.action === 'ai-chat') {
      setTimeout(() => setShowAIChat(true), 300);
    } else if (item.href) {
      setTimeout(() => router.push(item.href), 300);
    }
  };

  const getContainerStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      backgroundColor: 'transparent',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };

    return baseStyles;
  };

  const styles = StyleSheet.create({
    container: getContainerStyles(),
    draggableContainer: {
      position: 'absolute',
      width: 64,
      height: 64,
    },
    mainButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: primaryColor,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 5,
    },
  });

  return (
    <View style={styles.container}>
      {/* Dark overlay background */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
          pointerEvents: showMenu ? 'auto' : 'none',
        }}
        onTouchEnd={closeMenu}
      />

      {/* Backdrop - close menu when tapped */}
      {showMenu && (
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={closeMenu}
        />
      )}

      {/* Draggable Container */}
      <Animated.View
        style={[
          styles.draggableContainer,
          {
            left: positionX,
            top: positionY,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Animated Nav Items in Arc */}
        {showMenu && (
          <Animated.View
            style={{
              position: 'absolute',
              width: 250,
              height: 250,
              opacity: fadeAnim,
              left: -93,
              top: -93,
            }}
            pointerEvents="box-none"
          >
            {navItems.map((item, index) => {
              const { startAngle, endAngle } = menuAngles;
              const isInnerLayer = index < 4;
              let ratio: number;
              
              if (isInnerLayer) {
                ratio = index / 3;
              } else {
                const outerIndex = index - 4;
                ratio = (outerIndex + 1) / 6;
              }
              
              const angle = startAngle + (endAngle - startAngle) * ratio;
              const isSpecialOuterItem = index === 5 || index === 7; // AI Chat or Profile
              const radius = isInnerLayer ? 70 : (isSpecialOuterItem ? 140 : 120);

              return (
                <Animated.View
                  key={item.href || item.action}
                  style={{
                    position: 'absolute',
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1.5,
                    borderColor: theme.colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    left: '50%',
                    top: '50%',
                    marginLeft: -28,
                    marginTop: -28,
                    transform: [
                      { translateX: itemAnims[index].translateX },
                      { translateY: itemAnims[index].translateY },
                      { scale: itemAnims[index].scale },
                    ],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                >
                  <Pressable
                    style={{
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => handleItemPress(item)}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={primaryColor}
                    />
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Main Circle Button */}
        <Pressable
          style={styles.mainButton}
          onPress={handleLogPressIn}
        >
          <Ionicons
            name="game-controller"
            size={32}
            color="white"
          />
        </Pressable>
      </Animated.View>

      {/* AI Chat Modal */}
      <Modal
        visible={showAIChat}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIChat(false)}
      >
        <AIChat visible={showAIChat} onClose={() => setShowAIChat(false)} />
      </Modal>
    </View>
  );
}
