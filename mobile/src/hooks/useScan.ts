import { useState, useCallback } from 'react';
import { scanAPI } from '../services/api';

interface ScanResult {
  scan: {
    id: string;
    imageUrl: string;
    source: string;
    createdAt: string;
  };
  result: {
    variety: string;
    confidence: number;
    confidenceLevel: string;
    probabilities: Record<string, number>;
    processingMs: number;
    modelVersion: string;
  };
  variety: any;
}

export function useScan() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (imageUri: string, source: 'camera' | 'gallery' = 'camera', coords?: { lat: number; lng: number }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await scanAPI.scan(imageUri, source, coords);
      setResult(data);
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Scan failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return { scan, result, loading, error, reset };
}
