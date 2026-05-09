import { Logo } from '@/components/Logo';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  useWindowDimensions
} from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  
  const translateX = useRef(new Animated.Value(-width)).current;
  const translateY = useRef(new Animated.Value(-150)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1.2)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Cloud animation refs
  const cloudAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Cloud data: position, scale, animation index
  const clouds = [
    // Left side (4 clouds)
    { top: 40, left: 1, scale: 0.7, animIndex: 0 },
    { top: 170, left: 22, scale: 0.9, animIndex: 1 },
    { top: 300, left: 1, scale: 0.6, animIndex: 2 },
    { top: 450, left: 15, scale: 0.8, animIndex: 3 },
    // Right side (3 clouds)
    { top: 95, right: 1, scale: 1.75, animIndex: 4 },
    { top: 360, right: 1, scale: 0.85, animIndex: 5 },
    { top: 550, right: 1, scale: 0.7, animIndex: 6 },
  ];

  useEffect(() => {
    // Animate clouds with gentle floating motion
    const cloudAnimationSequences = cloudAnimations.map((anim) => 
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 20,
            duration: 3000,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: false,
          }),
        ])
      )
    );

    // Start all cloud animations
    cloudAnimationSequences.forEach((seq) => seq.start());

    // Fade out after 6 seconds
    const fadeOutSequence = Animated.sequence([
      Animated.delay(6000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]);

    fadeOutSequence.start(() => {
      router.replace('/onboarding');
    });
  }, [width, router, opacity]);

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
      {/* Clouds background layer */}
      {clouds.map((cloud, idx) => (
        <Animated.Image
          key={idx}
          source={require('@/assets/images/play-screen-icons/clouds.png')}
          style={{
            position: 'absolute',
            top: cloud.top,
            left: cloud.left,
            right: cloud.right,
            width: 250,
            height: 250,
            transform: [
              { scale: cloud.scale },
              { translateY: cloudAnimations[cloud.animIndex] },
            ],
            opacity: 0.8,
          }}
          resizeMode="contain"
        />
      ))}

      {/* Logo animation layer */}
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
