import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import AnimatedPressable from './AnimatedPressable';
import Icon from './Icon';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

const ACTION_SIZE = 48;

export default function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <AnimatedPressable onPress={onBack} style={styles.action} pressedScale={0.9}>
          <Icon name="chevronLeft" size={26} color={COLORS.textPrimary} />
        </AnimatedPressable>
      ) : (
        <View style={styles.action} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.action}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 54,
    paddingTop: 42,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  action: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
