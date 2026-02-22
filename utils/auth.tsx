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

  // Sync user from PocketBase auth store
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

    // Wait for the persisted auth to be restored before reading auth state
    pbReady.then(() => {
      if (!cancelled) syncUser();
    });

    // Subscribe to auth state changes
    const unsubscribe = pb.authStore.onChange(() => {
      if (!cancelled) syncUser();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const redirectUrl =
      Platform.OS === 'web'
        ? window.location.origin
        : 'pensee://auth';

    const authMethods = await pb.collection('users').listAuthMethods();
    const googleProvider = authMethods.oauth2?.providers?.find(
      (p: any) => p.name === 'google',
    );

    if (!googleProvider) {
      throw new Error('Google sign-in is not configured on the server. Please contact support.');
    }

    const authUrl = (() => {
      const url = new URL(googleProvider.authURL as string);
      url.searchParams.set('redirect_uri', redirectUrl);
      return url.toString();
    })();

    if (Platform.OS === 'web') {
      window.location.href = authUrl;
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    if (result.type !== 'success') return;

    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) throw new Error('No authorization code received from Google.');

    await pb.collection('users').authWithOAuth2Code(
      'google',
      code,
      googleProvider.codeVerifier,
      redirectUrl,
      { name: '', avatarURL: '' },
    );
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
    if (!pb.authStore.record?.id) throw new Error('Not authenticated.');
    await pb.collection('users').delete(pb.authStore.record.id);
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
