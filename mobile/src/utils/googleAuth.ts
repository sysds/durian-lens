import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

let AuthSession: typeof import('expo-auth-session') | null = null;
let Constants: typeof import('expo-constants').default | null = null;
let googleSetupError: string | null = null;

try {
  AuthSession = require('expo-auth-session');
  Constants = require('expo-constants').default;
  require('expo-web-browser').maybeCompleteAuthSession();
} catch {
  googleSetupError =
    'Google Sign-In needs the latest development build. Rebuild the app with npx expo run:android, then open the new Durian Lens app.';
}

const GOOGLE_CLIENT_ID =
  (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export function useGoogleAuth() {
  if (!AuthSession || !Constants) {
    return {
      promptAsync: async () => ({ type: 'dismiss' as const }),
      token: null,
      authError: null,
      redirectUri: '',
      isExpoGo: false,
      isReady: false,
      setupError: googleSetupError,
    };
  }

  return useGoogleAuthReady(AuthSession, Constants);
}

function useGoogleAuthReady(
  AuthSessionModule: typeof import('expo-auth-session'),
  ConstantsModule: typeof import('expo-constants').default,
) {
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const isExpoGo = ConstantsModule.appOwnership === 'expo';

  const redirectUri = AuthSessionModule.makeRedirectUri({
    native: Platform.OS === 'android' ? 'com.durianlens.app:/oauthredirect' : 'durianlens:/oauthredirect',
  });

  const [request, response, promptAsync] = AuthSessionModule.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSessionModule.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      AuthSessionModule.exchangeCodeAsync(
        {
          clientId: GOOGLE_CLIENT_ID,
          code: response.params.code,
          redirectUri,
          extraParams: {
            code_verifier: request?.codeVerifier || '',
          },
        },
        discovery,
      )
        .then((result) => {
          if (result.accessToken) {
            setToken(result.accessToken);
            setAuthError(null);
          } else {
            setAuthError('Google token exchange did not return an access token.');
          }
        })
        .catch((err) => {
          setAuthError('Google token exchange failed. Check your OAuth client type and redirect URI.');
          console.error('Google token exchange error:', err);
        });
    } else if (response?.type === 'error') {
      const msg = response.error?.message || response.params?.error_description || 'Google authorization failed.';
      setAuthError(msg);
    }
  }, [redirectUri, request?.codeVerifier, response]);

  return {
    promptAsync,
    token,
    authError,
    redirectUri,
    isExpoGo,
    isReady: request !== null && !!GOOGLE_CLIENT_ID && !isExpoGo,
    setupError: !GOOGLE_CLIENT_ID ? 'Google Client ID is missing. Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to mobile/.env.' : null,
  };
}
