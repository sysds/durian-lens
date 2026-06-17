import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface TraitBarProps {
  label: string;
  score: number;
}

export default function TraitBar({ label, score }: TraitBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score}/10</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${score * 10}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  score: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  track: {
    height: 6,
    backgroundColor: '#F0EDE8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primaryDark,
  },
});
