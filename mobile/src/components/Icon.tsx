import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

type IconFamily = typeof Ionicons | typeof MaterialCommunityIcons | typeof FontAwesome;

const ICONS: Record<string, { family: IconFamily; glyph: string }> = {
  camera: { family: Ionicons, glyph: 'camera-outline' },
  history: { family: Ionicons, glyph: 'time-outline' },
  leaf: { family: Ionicons, glyph: 'leaf-outline' },
  person: { family: Ionicons, glyph: 'person-outline' },
  check: { family: Ionicons, glyph: 'checkmark' },
  close: { family: Ionicons, glyph: 'close' },
  lightning: { family: Ionicons, glyph: 'flash-outline' },
  star: { family: Ionicons, glyph: 'star' },
  starOutline: { family: Ionicons, glyph: 'star-outline' },
  upload: { family: Ionicons, glyph: 'cloud-upload-outline' },
  info: { family: Ionicons, glyph: 'information-circle-outline' },
  chevronRight: { family: Ionicons, glyph: 'chevron-forward' },
  chevronLeft: { family: Ionicons, glyph: 'chevron-back' },
  settings: { family: Ionicons, glyph: 'settings-outline' },
  help: { family: Ionicons, glyph: 'help-circle-outline' },
  about: { family: Ionicons, glyph: 'information-circle-outline' },
  signOut: { family: Ionicons, glyph: 'log-out-outline' },
  scan: { family: Ionicons, glyph: 'scan-outline' },
  notification: { family: Ionicons, glyph: 'notifications-outline' },
  lock: { family: Ionicons, glyph: 'lock-closed-outline' },
  gallery: { family: Ionicons, glyph: 'images-outline' },
  flip: { family: Ionicons, glyph: 'camera-reverse-outline' },
  warning: { family: Ionicons, glyph: 'warning-outline' },
  durian: { family: MaterialCommunityIcons, glyph: 'fruit-pineapple' },
  crown: { family: MaterialCommunityIcons, glyph: 'crown-outline' },
  diamond: { family: Ionicons, glyph: 'diamond-outline' },
  pin: { family: Ionicons, glyph: 'location-outline' },
  calendar: { family: Ionicons, glyph: 'calendar-outline' },
  money: { family: Ionicons, glyph: 'pricetag-outline' },
  share: { family: Ionicons, glyph: 'share-outline' },
  google: { family: FontAwesome, glyph: 'google' },
  eye: { family: Ionicons, glyph: 'eye-outline' },
  eyeOff: { family: Ionicons, glyph: 'eye-off-outline' },
};

export default function Icon({ name, size = 20, color = '#888' }: IconProps) {
  const icon = ICONS[name] || ICONS.info;
  const IconComponent = icon.family as any;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <IconComponent name={icon.glyph} size={size} color={color} />
    </View>
  );
}

export function ScanFrameIcon({ size = 72, color = '#DAA520' }: { size?: number; color?: string }) {
  return <Icon name="scan" size={size} color={color} />;
}
