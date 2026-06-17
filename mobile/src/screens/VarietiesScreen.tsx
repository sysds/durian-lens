import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import Icon from '../components/Icon';
import { DURIAN_REGISTRY, DurianRegistryItem, sortDurianRegistry } from '../data/durianRegistry';
import AnimatedPressable from '../components/AnimatedPressable';
import ProfileShortcut from '../components/ProfileShortcut';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type SortMode = 'all' | 'popular' | 'newest' | 'clone';

const LOGO_SOURCE = require('../../assets/durian-lens-logo.jpg');
const FILTERS: Array<{ key: SortMode; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'popular', label: 'Popular' },
  { key: 'newest', label: 'Newest' },
  { key: 'clone', label: 'D Code' },
];

export default function VarietiesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('all');

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    const baseItems = DURIAN_REGISTRY.filter((item) => {
      if (sortMode === 'popular') return item.isFeatured || item.isPopular;
      return true;
    });

    const searchedItems = term
      ? baseItems.filter((item) =>
          [item.displayName, item.clone, item.commonName, item.registerDate, item.origin]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term)),
        )
      : baseItems;

    return sortDurianRegistry(searchedItems, sortMode);
  }, [query, sortMode]);

  const renderItem = ({ item, index }: { item: DurianRegistryItem; index: number }) => {
    const detailLine = [
      item.origin,
      item.registerDate ? `Registered ${item.registerDate}` : undefined,
    ]
        .filter(Boolean)
        .join('  •  ');

    const isFeatured = item.isFeatured && sortMode === 'all';
    const showSectionHeader = sortMode === 'all' && !isFeatured && index > 0 && filteredItems[index - 1]?.isFeatured;

    return (
      <>
        {showSectionHeader ? (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionText}>All Varieties</Text>
            <View style={styles.sectionLine} />
          </View>
        ) : null}
        <AnimatedPressable
          style={[styles.card, isFeatured && styles.cardFeatured]}
          onPress={() => navigation.navigate('VarietyDetail', { slug: item.slug })}
          pressedScale={0.98}
        >
          <View style={styles.iconBox}>
            <Image source={LOGO_SOURCE} style={styles.iconImage} />
          </View>
          <View style={styles.info}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.name}>{item.displayName}</Text>
              {isFeatured ? (
                <View style={styles.topBadge}>
                  <Icon name="star" size={10} color={COLORS.white} />
                  <Text style={styles.topBadgeText}>Top</Text>
                </View>
              ) : null}
            </View>
            {detailLine ? <Text style={styles.meta}>{detailLine}</Text> : null}
          </View>
          <View style={styles.chevron}>
            <Icon name="chevronRight" size={20} color={COLORS.textTertiary} />
          </View>
        </AnimatedPressable>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.clone}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.title}>Varieties</Text>
                <Text style={styles.subtitle}>{DURIAN_REGISTRY.length} registered Malaysian durian clones</Text>
              </View>
              <ProfileShortcut
                onPress={() => navigation.navigate('Profile')}
              />
            </View>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search clone, name, date, or origin"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="none"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((filter) => {
                const active = sortMode === filter.key;
                return (
                  <AnimatedPressable
                    key={filter.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSortMode(filter.key)}
                    pressedScale={0.96}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>{query ? 'No matching varieties found.' : 'No varieties found.'}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    paddingHorizontal: 0,
    paddingTop: 42,
    paddingBottom: 4,
  },
  headerRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 0,
    textAlign: 'left',
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  cardFeatured: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 1,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textTertiary,
    lineHeight: 17,
  },
  chevron: {
    paddingLeft: 4,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.primaryDark,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textTertiary,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  topBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
});
