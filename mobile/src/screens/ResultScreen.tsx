// screens/main/ResultScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../theme/colors';
import Icon from '../components/Icon';
import { submitFeedbackThunk, AppDispatch, RootState } from '../store';
import { formatVarietyName, getVarietyMeta } from '../utils/varietyMeta';
import { scanAPI } from '../services/api';
import { resolveApiAssetUrl } from '../utils/url';
import { getLocalScanImagePath } from '../utils/scanImages';
import AnimatedPressable from '../components/AnimatedPressable';
import ScreenHeader from '../components/ScreenHeader';

export default function ResultScreen({ navigation }: any) {
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const currentScan = useSelector((state: RootState) => state.scan.currentScan);
  const [loadedScan, setLoadedScan] = useState<any | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!route.params?.scanId) {
      setLoadedScan(null);
      setLocalImageUri(null);
      return;
    }

    getLocalScanImagePath(route.params.scanId).then(setLocalImageUri);

    let active = true;
    setLoadingScan(true);
    scanAPI.getById(route.params.scanId)
      .then((response) => {
        if (!active) return;
        const item = response.data;
        setLoadedScan({
          scan: {
            id: item.id,
            imageUrl: item.imageUrl,
            source: item.source,
            createdAt: item.createdAt,
            userFeedback: item.userFeedback,
          },
          result: {
            variety: item.predictedVariety,
            confidence: item.confidence,
            confidenceLevel: item.confidenceLevel,
            probabilities: item.probabilities,
            processingMs: item.processingMs,
            modelVersion: item.modelVersion,
          },
          variety: item.variety || {
            slug: item.predictedVariety,
            name: item.varietyName,
          },
        });
      })
      .catch(() => {
        if (active) Alert.alert('Unable to Load Scan', 'Please try opening this history item again.');
      })
      .finally(() => {
        if (active) setLoadingScan(false);
      });

    return () => {
      active = false;
    };
  }, [route.params?.scanId]);

  const data = loadedScan || route.params?.scanData || currentScan;
  const scan = data?.scan;
  const result = data?.result;
  const variety = data?.variety;

  const varietySlug = result?.variety || '';
  const meta = getVarietyMeta(varietySlug);
  const confidencePercent = Math.round((result?.confidence || 0) * 100);
  const confidenceLevel = result?.confidenceLevel || 'low';
  const confidenceColors =
    confidenceLevel === 'high'
      ? { fill: COLORS.success, text: COLORS.success }
      : confidenceLevel === 'medium'
      ? { fill: COLORS.warning, text: COLORS.warning }
      : { fill: COLORS.error, text: COLORS.error };
  const remoteImageUri = resolveApiAssetUrl(scan?.imageUrl || route.params?.imageUri);
  const displayImageUri = localImageUri || remoteImageUri;
  const scanDate = useMemo(() => {
    if (!scan?.createdAt) return null;
    return new Date(scan.createdAt).toLocaleString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [scan?.createdAt]);

  const handleShare = async () => {
    await Share.share({
      message: `I just scanned a ${variety?.name || formatVarietyName(varietySlug)} durian with ${confidencePercent}% confidence.`,
    });
  };

  useEffect(() => {
    setFeedbackSent(scan?.userFeedback || null);
  }, [scan?.id, scan?.userFeedback]);

  const sendFeedback = async (feedback: 'correct' | 'incorrect' | 'unsure') => {
    if (!scan?.id) return;
    try {
      await dispatch(submitFeedbackThunk({ id: scan.id, feedback })).unwrap();
      setFeedbackSent(feedback);
    } catch {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const hasContent = data && result;

  if (!hasContent && !loadingScan && !displayImageUri) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No scan result available.</Text>
        <AnimatedPressable style={styles.scanAgainButton} onPress={() => navigation.navigate('ScanTab')}>
          <Text style={styles.scanAgainText}>Scan Another</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Scan Result"
        onBack={() => navigation.goBack()}
        right={
          <AnimatedPressable onPress={handleShare} style={styles.headerAction} disabled={!hasContent} pressedScale={0.9}>
            <Icon name="share" size={24} color={hasContent ? COLORS.textPrimary : COLORS.textTertiary} />
          </AnimatedPressable>
        }
      />

      {/* Image — show immediately from history while loading details */}
      {displayImageUri ? (
        <Image source={{ uri: displayImageUri }} style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <Icon name="durian" size={48} color={COLORS.primary} />
        </View>
      )}

      {loadingScan ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Loading scan result...</Text>
        </View>
      ) : !hasContent ? (
        <View style={styles.loadingCard}>
          <Text style={styles.emptyText}>No scan result available.</Text>
          <AnimatedPressable style={styles.scanAgainButton} onPress={() => navigation.navigate('ScanTab')}>
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <>

      {/* Result Card */}
      <View style={styles.resultCard}>
        <View style={styles.varietyHeader}>
          <View style={[styles.varietyIcon, { backgroundColor: meta.bgLight }]}>
            <Icon name={meta.icon} size={30} color={meta.color} />
          </View>
          <View style={styles.varietyInfo}>
            <Text style={styles.varietyName}>{variety?.name || formatVarietyName(varietySlug)}</Text>
            <Text style={styles.scientificName}>{variety?.scientificName || 'Durio zibethinus'}</Text>
          </View>
        </View>

        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceLabel}>Confidence Score</Text>
          <View style={styles.confidenceBar}>
            <View style={[styles.confidenceFill, { width: `${confidencePercent}%`, backgroundColor: confidenceColors.fill }]} />
          </View>
          <Text style={[styles.confidenceValue, { color: confidenceColors.text }]}>{confidencePercent}% - {result.confidenceLevel}</Text>
        </View>

        <View style={styles.scanMetaRow}>
          {scanDate ? (
            <View style={styles.scanMetaItem}>
              <Text style={styles.scanMetaLabel}>Scanned</Text>
              <Text style={styles.scanMetaValue}>{scanDate}</Text>
            </View>
          ) : null}
          {result.processingMs ? (
            <View style={styles.scanMetaItem}>
              <Text style={styles.scanMetaLabel}>Time Taken</Text>
              <Text style={styles.scanMetaValue}>{(result.processingMs / 1000).toFixed(2)}s</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.description}>{variety?.description || 'No description available.'}</Text>
      </View>

      {/* Taste Profile */}
      {variety?.characteristics && variety.characteristics.length > 0 ? (
        <View style={styles.tasteCard}>
          <Text style={styles.cardTitle}>Taste Profile</Text>
          {variety.characteristics
            .filter((c: any) => c.score !== undefined && c.score !== null)
            .map((trait: any, index: number) => (
              <View key={index} style={styles.traitRow}>
                <Text style={styles.traitLabel}>{trait.label}</Text>
                <View style={styles.traitBar}>
                  <View style={[styles.traitFill, { width: `${trait.score * 10}%` }]} />
                </View>
                <Text style={styles.traitScore}>{trait.score}/10</Text>
              </View>
            ))}
        </View>
      ) : null}

      {/* Info Cards */}
      <View style={styles.infoGrid}>
        {variety?.origin ? (
          <View style={styles.infoCard}>
            <Icon name="pin" size={28} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Origin</Text>
            <Text style={styles.infoValue}>{variety.origin}</Text>
          </View>
        ) : null}
        {variety?.season ? (
          <View style={styles.infoCard}>
            <Icon name="calendar" size={28} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Season</Text>
            <Text style={styles.infoValue}>{variety.season}</Text>
          </View>
        ) : null}
        {variety?.priceRange ? (
          <View style={styles.infoCard}>
            <Icon name="money" size={28} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Price Range</Text>
            <Text style={styles.infoValue}>{variety.priceRange}</Text>
          </View>
        ) : null}
        <View style={styles.infoCard}>
          <Icon name="star" size={28} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Model</Text>
          <Text style={styles.infoValue}>{result.modelVersion || 'v1.0'}</Text>
        </View>
      </View>

      {/* Feedback */}
      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>Was this correct?</Text>
        <View style={styles.feedbackRow}>
          <AnimatedPressable
            style={[styles.feedbackBtn, feedbackSent === 'correct' && styles.feedbackBtnActive]}
            onPress={() => sendFeedback('correct')}
            disabled={!!feedbackSent}
          >
            <Text style={styles.feedbackBtnText}>{'\u2713'} Correct</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.feedbackBtn, feedbackSent === 'incorrect' && styles.feedbackBtnActive]}
            onPress={() => sendFeedback('incorrect')}
            disabled={!!feedbackSent}
          >
            <Text style={styles.feedbackBtnText}>{'\u2715'} Wrong</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.feedbackBtn, feedbackSent === 'unsure' && styles.feedbackBtnActive]}
            onPress={() => sendFeedback('unsure')}
            disabled={!!feedbackSent}
          >
            <Text style={styles.feedbackBtnText}>? Unsure</Text>
          </AnimatedPressable>
        </View>
        {feedbackSent ? <Text style={styles.feedbackThanks}>Thanks for your feedback!</Text> : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <AnimatedPressable style={styles.saveButton} onPress={() => setSaved(!saved)}>
          <Text style={styles.saveButtonText}>{saved ? `Saved ${'\u2713'}` : 'Save to History'}</Text>
        </AnimatedPressable>
        <AnimatedPressable style={styles.scanAgainButton} onPress={() => navigation.navigate('ScanTab')}>
          <Text style={styles.scanAgainText}>Scan Another</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.footer} />
        </>
      )}
    </ScrollView>
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
    backgroundColor: COLORS.background,
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  headerAction: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  imageFallback: {
    width: '100%',
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: -20,
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
    marginBottom: 20,
  },
  varietyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  varietyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  varietyName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scientificName: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  confidenceSection: {
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
  },
  scanMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  scanMetaItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
  },
  scanMetaLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scanMetaValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
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
  feedbackCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  feedbackBtnActive: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  feedbackBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  feedbackThanks: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  scanAgainButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  scanAgainText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  footer: {
    height: 20,
  },
});
