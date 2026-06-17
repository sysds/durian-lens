import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
  pct: string | number;
}

const CONFIG = {
  high: { bg: '#E8F5E9', color: '#2E7D32', label: 'High Confidence' },
  medium: { bg: '#FFF8E1', color: '#B8860B', label: 'Medium Confidence' },
  low: { bg: '#FBE9E7', color: '#BF360C', label: 'Low Confidence' },
};

export default function ConfidenceBadge({ level, pct }: ConfidenceBadgeProps) {
  const cfg = CONFIG[level] || CONFIG.medium;
  const displayPct = typeof pct === 'number' ? (pct * 100).toFixed(0) : pct;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.text, { color: cfg.color }]}>
        {cfg.label} {'\u2022'} {displayPct}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
