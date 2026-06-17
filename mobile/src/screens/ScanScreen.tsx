// screens/main/ScanScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../theme/colors';
import Icon from '../components/Icon';
import AnimatedPressable from '../components/AnimatedPressable';
import ProfileShortcut from '../components/ProfileShortcut';
import { performScanThunk, clearScan, AppDispatch, RootState } from '../store';
import { saveScanImage } from '../utils/scanImages';

export default function ScanScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { scanning } = useSelector((state: RootState) => state.scan);
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useFocusEffect(
    useCallback(() => {
      setImage(null);
      setTorchEnabled(false);
      dispatch(clearScan());
    }, [dispatch])
  );

  const ensurePermission = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to scan durians.'
        );
        return false;
      }
    }
    return true;
  };

  const takePicture = async () => {
    if (!(await ensurePermission())) return;
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
    if (photo?.uri) setImage(photo.uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const analyzeImage = async () => {
    if (!image) return;
    if (!accessToken || !user) {
      Alert.alert('Login Required', 'Please log in before scanning.');
      return;
    }
    try {
      const result = await dispatch(performScanThunk({ imageUri: image, source: 'camera' })).unwrap();
      await saveScanImage(result.scan.id, image);
      navigation.navigate('Result', { scanData: result, imageUri: image });
    } catch (e: any) {
      const msg = typeof e === 'string' ? e : 'Could not analyze the image.';
      Alert.alert('Scan Failed', msg);
    }
  };

  const retake = () => {
    setImage(null);
    dispatch(clearScan());
  };

  // Permission loading state
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Denied permission state
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permissionIcon}>
          <Icon name="camera" size={34} color={COLORS.primary} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>Allow Durian Lens to use your camera to scan durians.</Text>
        <AnimatedPressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </AnimatedPressable>
      </View>
    );
  }

  if (image) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: image }} style={styles.preview} />
        {!scanning ? (
          <SafeAreaView style={styles.topActions} pointerEvents="box-none">
            <View style={styles.topSpacer} />
            <ProfileShortcut
              onPress={() => navigation.getParent()?.navigate('Profile')}
              overlay
            />
          </SafeAreaView>
        ) : null}
        {scanning ? (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.analyzingText}>Analyzing durian...</Text>
          </View>
        ) : (
          <SafeAreaView style={styles.previewActions}>
            <AnimatedPressable style={styles.retakeButton} onPress={retake}>
              <Text style={styles.retakeText}>Retake</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.analyzeButton} onPress={analyzeImage}>
              <Text style={styles.analyzeText}>Identify Durian</Text>
            </AnimatedPressable>
          </SafeAreaView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} enableTorch={torchEnabled} />
      <SafeAreaView style={styles.topActions} pointerEvents="box-none">
        <AnimatedPressable
          style={[styles.flashButton, torchEnabled && styles.flashButtonActive]}
          onPress={() => setTorchEnabled((value) => !value)}
          pressedScale={0.92}
        >
          <Icon name="lightning" size={23} color={torchEnabled ? COLORS.white : COLORS.textPrimary} />
        </AnimatedPressable>
        <Text style={styles.cameraHeaderTitle}>Scan Durian</Text>
        <ProfileShortcut
          onPress={() => navigation.getParent()?.navigate('Profile')}
          overlay
        />
      </SafeAreaView>
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.scanFrame} pointerEvents="none">
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
        <Text style={styles.scanHint} pointerEvents="none">Center durian in frame</Text>
      </View>
      <View style={styles.controls}>
        <AnimatedPressable style={styles.controlButton} onPress={pickImage}>
          <Icon name="gallery" size={28} color={COLORS.white} />
          <Text style={styles.controlText}>Gallery</Text>
        </AnimatedPressable>

        <AnimatedPressable style={styles.shutterButton} onPress={takePicture} pressedScale={0.9}>
          <View style={styles.shutterInner} />
        </AnimatedPressable>

        <AnimatedPressable style={styles.controlButton} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
          <Icon name="flip" size={28} color={COLORS.white} />
          <Text style={styles.controlText}>Flip</Text>
        </AnimatedPressable>
      </View>
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
    backgroundColor: COLORS.background,
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 96,
    paddingBottom: 64,
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.white,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.white,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.white,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.white,
  },
  scanHint: {
    marginTop: 16,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  controlButton: {
    alignItems: 'center',
    width: 76,
  },
  controlText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 4,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 16,
  },
  previewActions: {
    position: 'absolute',
    bottom: 104,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  retakeButton: {
    flex: 0.85,
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1.45,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  topActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 42,
    paddingHorizontal: 20,
  },
  cameraHeaderTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  topSpacer: {
    width: 48,
    height: 48,
  },
  flashButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
