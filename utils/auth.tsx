import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import pb, { pbReady } from './pocketbase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  deleteAccount: async () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

function modelToUser(model: Record<string, any>): AuthUser {
  return {
    id: model['id'] as string,
    email: (model['email'] as string) ?? '',
    name: (model['name'] as string) ?? (model['username'] as string) ?? '',
    avatar: model['avatar'] as string | undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync user from PocketBase auth store and handle web redirect fallback
  useEffect(() => {
    let cancelled = false;

    const syncUser = () => {
      if (pb.authStore.isValid && pb.authStore.record) {
        setUser(modelToUser(pb.authStore.record));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    // when running in a browser we may land here after being redirected
    // directly from Google (popup blocked).  if the URL contains a code we
    // need to complete the PKCE exchange using the verifier we stored earlier.
    const handleWebCallback = async () => {
      if (Platform.OS !== 'web') return;
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!code) return;

      // pull stored verifier and clear it
      const stored = sessionStorage.getItem('pensee.oauth.codeVerifier');
      sessionStorage.removeItem('pensee.oauth.codeVerifier');

      try {
        await pb.collection('users').authWithOAuth2Code(
          'google',
          code,
          stored || '',
          window.location.origin + '/web',
          { name: '', avatarURL: '' },
        );
      } catch (err) {
        console.warn('web oauth callback failed', err);
      }
      // clean URL so we don't try again on next render
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    pbReady.then(async () => {
      if (Platform.OS === 'web') {
        await handleWebCallback();
      }
      if (!cancelled) syncUser();
    });

    const unsubscribe = pb.authStore.onChange(() => {
      if (!cancelled) syncUser();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  //
  // We use PocketBase's high-level `authWithOAuth2` which manages the entire
  // PKCE + realtime-SSE flow internally.  The SDK:
  //   1. Subscribes to the @oauth2 realtime channel on your PocketBase server
  //   2. Opens the Google auth URL via our `urlCallback`
  //   3. Google redirects to  <pocketbase>/api/oauth2-redirect
  //   4. PocketBase fires an SSE event back with the code
  //   5. The SDK calls authWithOAuth2Code internally and resolves the promise
  //
  // On web we open the URL in a popup so the page (and SSE connection) stays
  // alive.  On native we open an in-app browser session; the redirect goes to
  // PocketBase's own redirect page which posts back via the realtime channel.
  const signInWithGoogle = useCallback(async () => {
    const redirectUrl =
      Platform.OS === 'web'
        ? window.location.origin + '/web'
        : AuthSession.makeRedirectUri({ scheme: 'pensee' });

    // fetch provider info (includes PKCE verifier)
    const authMethods = await pb.collection('users').listAuthMethods();
    const googleProvider = authMethods.oauth2?.providers?.find(
      (p: any) => p.name === 'google',
    );

    if (!googleProvider) {
      throw new Error('Google sign-in is not configured on the server. Please contact support.');
    }

    const urlObj = new URL(googleProvider.authURL as string);
    urlObj.searchParams.set('redirect_uri', redirectUrl);
    const authUrl = urlObj.toString();

    if (Platform.OS === 'web') {
      // store verifier for callback handling regardless of how we open URL
      try {
        sessionStorage.setItem('pensee.oauth.codeVerifier', googleProvider.codeVerifier);
      } catch {}

      // On web we avoid the popup completely; in mobile Safari the browser
      // often blocks or never resolves the popup, so a simple navigation is
      // more reliable.  The redirect will hit handleWebCallback in this same
      // page and finish the PKCE exchange.
      window.location.href = authUrl;
      return;
    }

    // native flow using realtime helper
    await pb.collection('users').authWithOAuth2({
      provider: 'google',
      urlCallback: async (url: string) => {
        await WebBrowser.openBrowserAsync(url);
      },
    });
  }, []);

  // ── Email auth ────────────────────────────────────────────────────────────
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password);
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      });
      await pb.collection('users').authWithPassword(email, password);
    },
    [],
  );

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    pb.authStore.clear();
  }, []);

  // ── Profile update ────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data: { name?: string }) => {
    if (!pb.authStore.record?.id) throw new Error('Not authenticated.');
    await pb.collection('users').update(pb.authStore.record.id, data);
    // Refresh auth store to pick up updated fields
    await pb.collection('users').authRefresh();
  }, []);

  // ── Delete account ────────────────────────────────────────────────────────
  const deleteAccount = useCallback(async () => {
    const id = pb.authStore.record?.id;
    if (!id) throw new Error('Not authenticated.');
    // Refresh the token first so it is definitely valid right before the delete.
    try {
      await pb.collection('users').authRefresh();
    } catch (err) {
      console.warn('refresh before deletion failed', err);
      // continue regardless
    }

    try {
      await pb.collection('users').delete(id);
    } catch (err) {
      console.error('user delete failed', err);
      throw err; // propagate so caller can handle
    }

    // clear local auth state whether deletion succeeded or not
    pb.authStore.clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
