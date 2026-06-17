// screens/main/HistoryScreen.tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../theme/colors';
import { fetchHistoryThunk, fetchStatsThunk, clearHistory, deleteScanThunk, AppDispatch, RootState } from '../store';
import { formatVarietyName } from '../utils/varietyMeta';
import { resolveApiAssetUrl } from '../utils/url';
import { deleteLocalScanImage, getAllLocalScanImagePaths } from '../utils/scanImages';
import AnimatedPressable from '../components/AnimatedPressable';
import ProfileShortcut from '../components/ProfileShortcut';

type SortMode = 'newest' | 'oldest' | 'confidence';

function HistoryItem({
  item,
  onPress,
  onLongPress,
  formatDate,
  localImageUri,
}: {
  item: any;
  onPress: () => void;
  onLongPress: () => void;
  formatDate: (dateStr: string) => string;
  localImageUri?: string;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const confidence = item.confidence
    ? Math.round((typeof item.confidence === 'number' ? item.confidence : Number(item.confidence)) * 100)
    : 0;
  const confidenceLevel = item.confidenceLevel || 'low';
  const badgeColors =
    confidenceLevel === 'high'
      ? { bg: COLORS.successBg, text: COLORS.success }
      : confidenceLevel === 'medium'
      ? { bg: COLORS.warningBg, text: COLORS.warning }
      : { bg: COLORS.errorBg, text: COLORS.error };
  const remoteUrl = resolveApiAssetUrl(item.imageUrl);
  const varietyThumbnailUrl = resolveApiAssetUrl(item.varietyThumbnailUrl);
  const displayUrl = localImageUri || (remoteUrl && !imageFailed ? remoteUrl : varietyThumbnailUrl);

  return (
    <AnimatedPressable
      style={styles.historyCard}
      pressedScale={0.98}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
    >
      <View style={styles.thumbnail}>
        {displayUrl ? (
          <Image
            source={{ uri: displayUrl }}
            style={styles.thumbnailImage}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Text style={styles.thumbnailFallbackText}>No Image</Text>
          </View>
        )}
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyVariety}>{item.varietyName || formatVarietyName(item.predictedVariety)}</Text>
        <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={[styles.confidenceBadge, { backgroundColor: badgeColors.bg }]}>
        <Text style={[styles.confidenceText, { color: badgeColors.text }]}>{confidence}%</Text>
      </View>
    </AnimatedPressable>
  );
}

export default function HistoryScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { items, stats, loading, error } = useSelector((state: RootState) => state.history);
  const [sortMode, setSortMode] = React.useState<SortMode>('newest');
  const [localImages, setLocalImages] = React.useState<Record<string, string>>({});

  const load = useCallback(() => {
    dispatch(clearHistory());
    dispatch(fetchHistoryThunk({}));
    dispatch(fetchStatsThunk());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getAllLocalScanImagePaths().then(setLocalImages);
  }, [items]);

  const onRefresh = () => {
    load();
  };

  const dedupedItems = useMemo(() => {
    const seen = new Set<string>();
    const unique = items.filter((item: any) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return [...unique].sort((a: any, b: any) => {
      if (sortMode === 'confidence') return Number(b.confidence || 0) - Number(a.confidence || 0);
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortMode === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [items, sortMode]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const confirmDelete = (item: any) => {
    const varietyName = item.varietyName || formatVarietyName(item.predictedVariety);
    Alert.alert(
      'Delete Scan?',
      `Remove ${varietyName} from your scan history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteScanThunk(item.id)).unwrap();
              await deleteLocalScanImage(item.id);
              setLocalImages((current) => {
                const next = { ...current };
                delete next[item.id];
                return next;
              });
              dispatch(fetchStatsThunk());
            } catch (e: any) {
              const message = typeof e === 'string'
                ? e
                : e?.response?.data?.message || e?.message || 'Could not delete this scan. Please try again.';
              Alert.alert('Delete Failed', message);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <HistoryItem
        item={item}
        formatDate={formatDate}
        localImageUri={localImages[item.id]}
        onPress={() => navigation.navigate('Result', { scanId: item.id, imageUri: localImages[item.id] || item.imageUrl })}
        onLongPress={() => confirmDelete(item)}
      />
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Loading history...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorText}>
            Could not reach the backend server.{'\n'}
            Make sure Docker is running and your phone is on the same WiFi.
          </Text>
          <AnimatedPressable style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </AnimatedPressable>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No scans yet. Go scan a durian!</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSubtitle}>
              {stats?.totalScans ?? dedupedItems.length} total scans
              {stats?.favoriteVariety ? ` - Favorite: ${formatVarietyName(stats.favoriteVariety)}` : ''}
            </Text>
          </View>
          <ProfileShortcut
            onPress={() => navigation.getParent()?.navigate('Profile')}
          />
        </View>
        <View style={styles.sortRow}>
          {[
            ['newest', 'Newest'],
            ['oldest', 'Oldest'],
            ['confidence', 'Confidence'],
          ].map(([value, label]) => (
            <AnimatedPressable
              key={value}
              style={[styles.sortButton, sortMode === value && styles.sortButtonActive]}
              onPress={() => setSortMode(value as SortMode)}
              pressedScale={0.96}
            >
              <Text style={[styles.sortText, sortMode === value && styles.sortTextActive]}>{label}</Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <FlatList
        data={dedupedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          dedupedItems.length === 0 && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 12,
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'left',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sortTextActive: {
    color: COLORS.white,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textTertiary,
    marginTop: 12,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  thumbnailFallbackText: {
    color: COLORS.textTertiary,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyVariety: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  confidenceBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
