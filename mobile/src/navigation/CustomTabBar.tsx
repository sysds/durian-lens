import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS } from '../theme/colors';
import Icon from '../components/Icon';
import AnimatedPressable from '../components/AnimatedPressable';

const TAB_CONFIG: Record<string, { label: string; icon: string }> = {
  HistoryTab: { label: 'History', icon: 'history' },
  VarietiesTab: { label: 'Varieties', icon: 'leaf' },
  ScanTab: { label: 'Scan', icon: 'camera' },
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || { label: route.name, icon: 'leaf' };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (route.name === 'ScanTab') {
            return (
              <View key={route.key} style={styles.scanSlot}>
                <AnimatedPressable onPress={onPress} style={styles.scanBtn} pressedScale={0.92}>
                  <View style={[styles.scanCircle, isFocused && styles.scanCircleActive]}>
                    <Icon name="camera" size={22} color={isFocused ? COLORS.primary : '#888'} />
                  </View>
                </AnimatedPressable>
              </View>
            );
          }

          return (
            <AnimatedPressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              pressedScale={0.94}
            >
              <Icon
                name={config.icon}
                size={22}
                color={isFocused ? COLORS.primaryDark : COLORS.textTertiary}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {options.title || config.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 14,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 68,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: COLORS.primaryDark,
  },
  scanSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  scanBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F5F2EE',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
  },
  scanCircleActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});
