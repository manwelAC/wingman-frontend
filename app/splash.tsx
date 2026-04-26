import { Logo } from '@/components/Logo';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    View,
    useWindowDimensions,
} from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  
  const translateX = useRef(new Animated.Value(-width)).current;
  const translateY = useRef(new Animated.Value(-150)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1.2)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Dynamic side-to-side with vertical movement and flip
    const animationSequence = Animated.sequence([
      // First pass: left to right (top position, normal orientation)
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: width + 150,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: -150,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
      
      // Second pass: right to left (bottom position, flipped)
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -width - 150,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 150,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(scaleX, {
          toValue: -1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
      
      // Third pass: left to right (middle-top, normal)
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: width + 100,
          duration: 550,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 550,
          useNativeDriver: false,
        }),
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 550,
          useNativeDriver: false,
        }),
      ]),
      
      // Fourth pass: right to left (middle-bottom, flipped)
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -width - 100,
          duration: 480,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 120,
          duration: 480,
          useNativeDriver: false,
        }),
        Animated.timing(scaleX, {
          toValue: -1,
          duration: 480,
          useNativeDriver: false,
        }),
      ]),
      
      // Final settle to center
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
      
      // Hold in center
      Animated.delay(1200),
      
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]);

    animationSequence.start(() => {
      router.replace('/onboarding');
    });
  }, [width, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          transform: [
            { translateX },
            { translateY },
            { scaleX },
            { scale },
          ],
          opacity,
        }}
      >
        <Logo size={280} withMargin={false} />
      </Animated.View>
    </View>
  );
}
