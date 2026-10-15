'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  date_format: string;
  time_format: string;
}

export interface UserEmailNotifications {
  order_updates: boolean;
  payment_reminders: boolean;
  delivery_updates: boolean;
  promotions: boolean;
  newsletter: boolean;
  security_alerts: boolean;
}

export interface UserPrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends';
  show_order_history: boolean;
  analytics_consent: boolean;
  marketing_consent: boolean;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  preferences: UserPreferences;
  email_notifications: UserEmailNotifications;
  privacy_settings: UserPrivacySettings;
}

interface PreferencesContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateNotifications: (notifs: Partial<UserEmailNotifications>) => Promise<void>;
  updatePrivacy: (privacy: Partial<UserPrivacySettings>) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const initializedRef = useRef(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
      .from('profiles')
      .update({ preferences: { ...profile?.preferences, ...prefs } })
      .eq('id', user.id);

    if (error) throw error;
    setProfile(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...prefs } } : null);
  };

  const updateNotifications = async (notifs: Partial<UserEmailNotifications>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
      .from('profiles')
      .update({ email_notifications: { ...profile?.email_notifications, ...notifs } })
      .eq('id', user.id);

    if (error) throw error;
    setProfile(prev => prev ? { ...prev, email_notifications: { ...prev.email_notifications, ...notifs } } : null);
  };

  const updatePrivacy = async (privacy: Partial<UserPrivacySettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
      .from('profiles')
      .update({ privacy_settings: { ...profile?.privacy_settings, ...privacy } })
      .eq('id', user.id);

    if (error) throw error;
    setProfile(prev => prev ? { ...prev, privacy_settings: { ...prev.privacy_settings, ...privacy } } : null);
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) throw error;
    setProfile(prev => prev ? { ...prev, ...data } : null);
  }

  const refresh = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PreferencesContext.Provider value={{
      profile,
      loading,
      error,
      refresh,
      updatePreferences,
      updateNotifications,
      updatePrivacy,
      updateProfile,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}