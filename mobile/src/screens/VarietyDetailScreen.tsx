import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import Icon from '../components/Icon';
import { findDurianRegistryItem } from '../data/durianRegistry';
import { varietyAPI } from '../services/api';
import { formatVarietyName } from '../utils/varietyMeta';
import ScreenHeader from '../components/ScreenHeader';

type RouteProps = NativeStackScreenProps<MainStackParamList, 'VarietyDetail'>['route'];

const LOGO_SOURCE = require('../../assets/durian-lens-logo.jpg');

interface VarietyDetail {
  id?: string;
  slug: string;
  name: string;
  scientificName?: string;
  description?: string;
  origin?: string;
  season?: string;
  priceRange?: string;
  characteristics?: Array<{
    id?: string;
    label: string;
    value: string;
    score?: number | null;
  }>;
}

export default function VarietyDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const registryItem = findDurianRegistryItem(route.params.slug);

  const slug = registryItem?.slug || route.params.slug;

  // Start with registry data so the screen is never empty
  const [variety, setVariety] = useState<VarietyDetail>(() => ({
    slug,
    name: registryItem?.displayName || formatVarietyName(slug),
    scientificName: 'Durio zibethinus',
    origin: registryItem?.origin,
    description: undefined,
    season: undefined,
    priceRange: undefined,
    characteristics: undefined,
  }));

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    varietyAPI
      .getBySlug(slug)
      .then((res) => {
        if (!active) return;
        const data = res.data;
        setVariety((prev) => ({
          ...prev,
          id: data.id,
          slug: data.slug,
          name: data.name || prev.name,
          scientificName: data.scientificName || prev.scientificName,
          description: data.description || prev.description,
          origin: data.origin || prev.origin,
          season: data.season || prev.season,
          priceRange: data.priceRange || prev.priceRange,
          characteristics: data.characteristics || prev.characteristics,
        }));
      })
      .catch(() => {
        // Silently ignore any API error — registry data is already showing
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const renderTasteProfile = () => {
    if (!variety.characteristics || variety.characteristics.length === 0) return null;
    const scored = variety.characteristics.filter((c) => c.score !== undefined && c.score !== null);
    if (scored.length === 0) return null;

    return (
      <View style={styles.tasteCard}>
        <Text style={styles.cardTitle}>Taste Profile</Text>
        {scored.map((trait, index) => (
          <View key={index} style={styles.traitRow}>
            <Text style={styles.traitLabel}>{trait.label}</Text>
            <View style={styles.traitBar}>
              <View style={[styles.traitFill, { width: `${(trait.score || 0) * 10}%` }]} />
            </View>
            <Text style={styles.traitScore}>{trait.score}/10</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderInfoCards = () => {
    const cards: Array<{ icon: string; label: string; value?: string }> = [
      { icon: 'pin', label: 'Origin', value: variety.origin },
      { icon: 'calendar', label: 'Season', value: variety.season },
      { icon: 'money', label: 'Price Range', value: variety.priceRange },
      { icon: 'star', label: 'Clone', value: registryItem?.clone },
      { icon: 'star', label: 'Registered', value: registryItem?.registerDate },
    ];

    const visible = cards.filter((c) => c.value);
    if (visible.length === 0) return null;

    const isLastCardFullWidth = visible.length % 2 === 1;

    return (
      <View style={styles.infoGrid}>
        {visible.map((card, idx) => {
          const isLast = idx === visible.length - 1;
          const isFullWidth = isLastCardFullWidth && isLast;
          return (
            <View key={idx} style={[styles.infoCard, isFullWidth && styles.infoCardFull]}>
              <Icon name={card.icon} size={28} color={COLORS.primary} />
              <Text style={styles.infoLabel}>{card.label}</Text>
              <Text style={styles.infoValue}>{card.value}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRegistryRows = () => {
    if (!registryItem) return null;
    const rows = [
      ['Common Name', registryItem.commonName],
      ['Clone', registryItem.clone],
      ['Registered', registryItem.registerDate],
      ['Origin', registryItem.origin],
    ].filter(([, value]) => value);

    return (
      <View style={styles.registryCard}>
        <Text style={styles.cardTitle}>Registry Information</Text>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.registryRow}>
            <Text style={styles.registryLabel}>{label}</Text>
            <Text style={styles.registryValue}>{value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const hasDescription = !!(variety.description && variety.description.trim().length > 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Variety Detail" onBack={() => navigation.goBack()} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Image source={LOGO_SOURCE} style={styles.logoImage} />
        </View>
        <Text style={styles.title}>{variety.name}</Text>
        <Text style={styles.subtitle}>{variety.scientificName}</Text>
      </View>

      {/* Description */}
      <View style={styles.resultCard}>
        <View style={styles.varietyHeader}>
          <View style={styles.varietyIcon}>
            <Image source={LOGO_SOURCE} style={styles.smallLogo} />
          </View>
          <View style={styles.varietyInfo}>
            <Text style={styles.varietyName}>{variety.name}</Text>
            <Text style={styles.scientificName}>{variety.scientificName}</Text>
          </View>
          {loading && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
          )}
        </View>
        {hasDescription ? (
          <Text style={styles.description}>{variety.description}</Text>
        ) : (
          <Text style={styles.noDescription}>
            No detailed description available for this variety yet.
          </Text>
        )}
      </View>

      {/* Taste Profile */}
      {renderTasteProfile()}

      {/* Info Cards */}
      {renderInfoCards()}

      {/* Registry Details */}
      {renderRegistryRows()}

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  varietyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  varietyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  smallLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  varietyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  varietyName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scientificName: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  noDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  tasteCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  traitLabel: {
    width: 85,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  traitBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  traitFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  traitScore: {
    width: 35,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoCard: {
    width: '48%',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  infoCardFull: {
    width: '100%',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  registryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  registryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  registryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  registryValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    height: 20,
  },
});
