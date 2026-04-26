import React from 'react';
import { Image, ImageProps, StyleSheet } from 'react-native';

const logoImage = require('./logo.png');

interface LogoProps extends Omit<ImageProps, 'source'> {
  size?: number;
  withMargin?: boolean;
}

export function Logo({ size = 100, withMargin = true, style, ...props }: LogoProps) {
  const styles = StyleSheet.create({
    logo: {
      width: size,
      height: size,
      marginBottom: withMargin ? 16 : 0,
    },
  });

  return (
    <Image
      source={logoImage}
      style={[styles.logo, style]}
      resizeMode="contain"
      {...props}
    />
  );
}
