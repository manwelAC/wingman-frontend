import { Button } from '@/components/ui/Button';
import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    Pressable,
    SafeAreaView,
    Text,
    View,
    useWindowDimensions
} from 'react-native';

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Log Your Grinds',
    description: 'Track every grind you complete',
    icon: 'document-text',
  },
  {
    id: '2',
    title: 'Track Your Earnings',
    description: 'See how much you\'ve earned',
    icon: 'cash',
  },
  {
    id: '3',
    title: 'Controlled Pricing',
    description: 'Fix your own pricing depending on your business',
    icon: 'pricetag',
  },
 {
    id: '4',
    title: 'Auto-Calculate',
    description: 'Just input your grind, System does the work!',
    icon: 'rocket',
  },
   {
    id: '5',
    title: 'Consistency',
    description: 'Keeps your business alive',
    icon: 'pulse',
  },
     {
    id: '6',
    title: 'Seamless Auth',
    description: 'Allows you to use your own biometrics',
    icon: 'finger-print',
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    router.push('/auth/register');
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleDotPress = (index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
    setCurrentIndex(index);
  };

  const isLastSlide = currentIndex === slides.length - 1;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View
      style={{
        width,
        paddingHorizontal: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
      }}
    >
      <Ionicons
        name={item.icon as any}
        size={100}
        color={theme.colors.primary}
        style={{ marginBottom: theme.spacing.xl }}
      />
      <Text
        style={{
          fontSize: 28,
          fontFamily: 'DMMono',
          fontWeight: 'bold',
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        {item.title}
      </Text>
      <Text
        style={{
          fontSize: 15,
          fontFamily: 'DMMono',
          color: theme.colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        }}
      >
        {item.description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const contentOffsetX = event.nativeEvent.contentOffset.x;
          const currentIndex = Math.round(contentOffsetX / width);
          setCurrentIndex(currentIndex);
        }}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
      />

      {/* Dots */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: theme.spacing.lg,
          gap: theme.spacing.sm,
        }}
      >
        {slides.map((_, index) => (
          <Pressable
            key={index}
            onPress={() => handleDotPress(index)}
            style={{
              width: currentIndex === index ? 28 : 10,
              height: 10,
              borderRadius: 5,
              backgroundColor:
                currentIndex === index
                  ? theme.colors.primary
                  : theme.colors.border,
            }}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: theme.spacing.lg,
          minHeight: 64,
          justifyContent: 'flex-end',
        }}
      >
        {!isLastSlide ? (
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.md,
            }}
          >
            <Pressable
              onPress={handleSkip}
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: theme.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'DMMono',
                  color: theme.colors.textSecondary,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                Skip
              </Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              <Button
                label="Next"
                variant="primary"
                onPress={handleNext}
              />
            </View>
          </View>
        ) : (
          <Button
            label="Register Now"
            variant="primary"
            onPress={handleRegister}
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}
