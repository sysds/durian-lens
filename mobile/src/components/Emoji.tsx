import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmojiProps {
  symbol: string;
  size?: number;
}

export default function Emoji({ symbol, size = 32 }: EmojiProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.text, { fontSize: size * 0.8 }]}>{symbol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: undefined,
  },
});
