import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const SCAN_IMAGES_DIR = FileSystem.documentDirectory + 'scan_images/';
const SCAN_IMAGE_MAP_KEY = 'scan_image_map';

async function ensureDir() {
  const dirInfo = await FileSystem.getInfoAsync(SCAN_IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SCAN_IMAGES_DIR, { intermediates: true });
  }
}

export async function saveScanImage(scanId: string, imageUri: string): Promise<string> {
  await ensureDir();
  const destUri = SCAN_IMAGES_DIR + `${scanId}.jpg`;
  await FileSystem.copyAsync({ from: imageUri, to: destUri });

  const mapJson = await AsyncStorage.getItem(SCAN_IMAGE_MAP_KEY);
  const map = mapJson ? JSON.parse(mapJson) : {};
  map[scanId] = destUri;
  await AsyncStorage.setItem(SCAN_IMAGE_MAP_KEY, JSON.stringify(map));

  return destUri;
}

export async function getLocalScanImagePath(scanId: string): Promise<string | null> {
  const mapJson = await AsyncStorage.getItem(SCAN_IMAGE_MAP_KEY);
  if (!mapJson) return null;
  const map = JSON.parse(mapJson);
  const path = map[scanId];
  if (!path) return null;

  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

export async function getAllLocalScanImagePaths(): Promise<Record<string, string>> {
  const mapJson = await AsyncStorage.getItem(SCAN_IMAGE_MAP_KEY);
  if (!mapJson) return {};
  const map = JSON.parse(mapJson);

  const valid: Record<string, string> = {};
  for (const [id, uri] of Object.entries(map)) {
    const info = await FileSystem.getInfoAsync(uri as string);
    if (info.exists) {
      valid[id] = uri as string;
    }
  }
  return valid;
}

export async function deleteLocalScanImage(scanId: string): Promise<void> {
  const mapJson = await AsyncStorage.getItem(SCAN_IMAGE_MAP_KEY);
  if (!mapJson) return;

  const map = JSON.parse(mapJson);
  const path = map[scanId];
  if (path) {
    await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
  }

  delete map[scanId];
  await AsyncStorage.setItem(SCAN_IMAGE_MAP_KEY, JSON.stringify(map));
}
