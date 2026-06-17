import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';
import AnimatedPressable from './AnimatedPressable';
import Icon from './Icon';

interface ProfileShortcutProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  overlay?: boolean;
}

export const PROFILE_SHORTCUT_SIZE = 48;

export default function ProfileShortcut({ onPress, style, overlay = false }: ProfileShortcutProps) {
  return (
    <AnimatedPressable
      style={[styles.button, overlay && styles.overlayButton, style]}
      onPress={onPress}
      pressedScale={0.92}
    >
      <Icon name="person" size={24} color={COLORS.textPrimary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: PROFILE_SHORTCUT_SIZE,
    height: PROFILE_SHORTCUT_SIZE,
    borderRadius: PROFILE_SHORTCUT_SIZE / 2,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayButton: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(0,0,0,0.08)',
  },
});
