import { COLORS } from '../theme/colors';

export const VARIETY_META: Record<string, { icon: string; color: string; bgLight: string; localName?: string }> = {
  'musang-king': {
    icon: 'crown',
    color: '#B7791F',
    bgLight: '#FFF8E1',
    localName: 'Musang King',
  },
  'black-thorn': {
    icon: 'leaf',
    color: '#2D4A1E',
    bgLight: '#F1F8EC',
    localName: 'Black Thorn',
  },
  d24: {
    icon: 'diamond',
    color: '#1A5276',
    bgLight: '#EBF5FB',
    localName: 'Sultan',
  },
  'red-prawn': {
    icon: 'durian',
    color: '#B33A2E',
    bgLight: '#FDECEC',
    localName: 'Udang Merah',
  },
  'tupai-king': {
    icon: 'durian',
    color: '#7A5C12',
    bgLight: '#FFF7D8',
    localName: 'Tupai King',
  },
  'golden-phoenix': {
    icon: 'durian',
    color: '#D4A017',
    bgLight: '#FFF9E6',
    localName: 'Golden Phoenix',
  },
  ioi: {
    icon: 'durian',
    color: '#2E7D32',
    bgLight: '#E8F5E9',
    localName: 'IOI',
  },
  'hor-lor': {
    icon: 'durian',
    color: '#5D8AA8',
    bgLight: '#EAF2F8',
    localName: 'Hor Lor',
  },
  'dato-nina': {
    icon: 'durian',
    color: '#6B4E9B',
    bgLight: '#F1ECF8',
    localName: 'Dato Nina',
  },
  xo: {
    icon: 'durian',
    color: '#795548',
    bgLight: '#F4EDE9',
    localName: 'XO',
  },
  tekka: {
    icon: 'durian',
    color: '#8A6A00',
    bgLight: '#FFF6D5',
    localName: 'Tekka',
  },
  'green-skin': {
    icon: 'durian',
    color: '#388E3C',
    bgLight: '#E8F5E9',
    localName: 'Green Skin',
  },
  d101: {
    icon: 'durian',
    color: '#E65100',
    bgLight: '#FBE9E7',
    localName: 'D101',
  },
  d13: {
    icon: 'durian',
    color: '#F57C00',
    bgLight: '#FFF3E0',
    localName: 'D13',
  },
  d88: {
    icon: 'durian',
    color: '#FBC02D',
    bgLight: '#FFFDE7',
    localName: 'D88',
  },
  d99: {
    icon: 'durian',
    color: '#AFB42B',
    bgLight: '#F9FBE7',
    localName: 'D99',
  },
  'd145-beserah': {
    icon: 'durian',
    color: '#7B1FA2',
    bgLight: '#F3E5F5',
    localName: 'D145 Beserah',
  },
  'd158-kan-yao': {
    icon: 'durian',
    color: '#00796B',
    bgLight: '#E0F2F1',
    localName: 'D158 Kan Yao',
  },
  d160: {
    icon: 'durian',
    color: '#C62828',
    bgLight: '#FFEBEE',
    localName: 'D160',
  },
  d168: {
    icon: 'durian',
    color: '#1565C0',
    bgLight: '#E3F2FD',
    localName: 'D168',
  },
  d175: {
    icon: 'durian',
    color: '#AD1457',
    bgLight: '#FCE4EC',
    localName: 'D175',
  },
  'd198-kim-hong': {
    icon: 'durian',
    color: '#6A1B9A',
    bgLight: '#F3E5F5',
    localName: 'D198 Kim Hong',
  },
  kampung: {
    icon: 'tree-pine',
    color: '#33691E',
    bgLight: '#F1F8E9',
    localName: 'Kampung',
  },
};

export const DEFAULT_VARIETY_META = {
  icon: 'durian',
  color: COLORS.primary,
  bgLight: COLORS.primarySoft,
  localName: undefined,
};

export const DETECTED_VARIETY_DETAILS: Record<string, any> = {
  'musang-king': {
    slug: 'musang-king',
    clone: 'D197',
    name: 'D197 Musang King',
    scientificName: 'Durio zibethinus cv. D197 Musang King',
    registeredDate: '09 Dec 1993',
    origin: 'Tanah Merah, Kelantan',
    season: 'April - August',
    priceRange: 'MYR 25-80/kg',
    description:
      'Musang King is known for deep golden flesh, rich creamy texture, and a strong bittersweet profile. It is one of Malaysia\'s most recognized premium durian varieties.',
    characteristics: [
      { label: 'Sweetness', score: 8 },
      { label: 'Bitterness', score: 7 },
      { label: 'Creaminess', score: 9 },
      { label: 'Aroma', score: 9 },
    ],
  },
  d24: {
    slug: 'd24',
    clone: 'D24',
    name: 'D24 Sultan',
    scientificName: 'Durio zibethinus cv. D24 Sultan',
    registeredDate: '30 Nov 1937',
    origin: 'Bukit Merah, Perak',
    season: 'June - September',
    priceRange: 'MYR 10-25/kg',
    description:
      'D24 Sultan is a classic Malaysian durian with creamy pale yellow flesh and a balanced sweet-bitter taste. It is widely appreciated for reliable flavor and approachable intensity.',
    characteristics: [
      { label: 'Sweetness', score: 7 },
      { label: 'Bitterness', score: 6 },
      { label: 'Creaminess', score: 7 },
      { label: 'Aroma', score: 7 },
    ],
  },
  'black-thorn': {
    slug: 'black-thorn',
    clone: 'D200',
    name: 'D200 Black Thorn',
    scientificName: 'Durio zibethinus cv. D200 Black Thorn',
    registeredDate: '2016',
    origin: 'Seberang Perai Selatan, Pulau Pinang',
    season: 'June - August',
    priceRange: 'MYR 50-120/kg',
    description:
      'Black Thorn is a premium Penang variety with velvety pale yellow flesh, a complex sweet-bitter taste, and a distinctive floral finish.',
    characteristics: [
      { label: 'Sweetness', score: 9 },
      { label: 'Bitterness', score: 6 },
      { label: 'Creaminess', score: 10 },
      { label: 'Aroma', score: 8 },
    ],
  },
};

export function getVarietyMeta(slug?: string | null) {
  if (!slug) return DEFAULT_VARIETY_META;
  return VARIETY_META[slug] || DEFAULT_VARIETY_META;
}

export function getDetectedVarietyDetails(slug?: string | null) {
  if (!slug) return undefined;
  return DETECTED_VARIETY_DETAILS[slug];
}

export function formatVarietyName(value?: string | null) {
  if (!value) return 'Unknown variety';
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
