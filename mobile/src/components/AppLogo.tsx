import React from 'react';
import { Image, StyleSheet, ImageStyle, StyleProp } from 'react-native';

interface AppLogoProps {
  size?: number;
  radius?: number;
  style?: StyleProp<ImageStyle>;
}

export default function AppLogo({ size = 64, radius = 18, style }: AppLogoProps) {
  return (
    <Image
      source={require('../../assets/durian-lens-logo.jpg')}
      style={[styles.logo, { width: size, height: size, borderRadius: radius }, style]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    overflow: 'hidden',
  },
});
