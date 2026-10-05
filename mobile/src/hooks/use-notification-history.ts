// Bildirim geçmişi için backend'de ayrı bir tablo yok — bu tamamen cihaz
// üzerinde (on-device) AsyncStorage'da tutulan, en fazla son
// HISTORY_LIMIT kaydı saklayan basit bir liste.
//
// `useNotificationHistoryListener` uygulama genelinde (bkz. `_layout.tsx`)
// bir kez çağrılmalı: gelen her bildirimi listeye ekler. `useNotificationHistory`
// ise bildirim geçmişi ekranında listeyi okumak ve temizlemek için kullanılır.

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = 'scald:notification-history';
const HISTORY_LIMIT = 30;

export type NotificationHistoryEntry = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
};

async function readHistory(): Promise<NotificationHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NotificationHistoryEntry[]) : [];
  } catch (error) {
    console.warn('[useNotificationHistory] Geçmiş okunamadı:', error);
    return [];
  }
}

async function writeHistory(entries: NotificationHistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
  } catch (error) {
    console.warn('[useNotificationHistory] Geçmiş kaydedilemedi:', error);
  }
}

/**
 * Uygulama kök bileşeninde (bkz. `_layout.tsx`) bir kez çağrılmalı. Ön planda
 * alınan her bildirimi cihazdaki bildirim geçmişi listesine ekler.
 */
export function useNotificationHistoryListener() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const { content } = notification.request;
      const entry: NotificationHistoryEntry = {
        id: notification.request.identifier,
        title: content.title ?? 'Bildirim',
        body: content.body ?? '',
        receivedAt: new Date().toISOString(),
      };

      readHistory()
        .then((existing) => writeHistory([entry, ...existing]))
        .catch((error) => {
          console.warn('[useNotificationHistoryListener] Bildirim kaydedilemedi:', error);
        });
    });

    return () => subscription.remove();
  }, []);
}

/**
 * Bildirim geçmişi ekranında kullanılır: AsyncStorage'daki kayıtlı listeyi
 * okur ve listeyi temizleme fonksiyonu sağlar.
 */
export function useNotificationHistory() {
  const [history, setHistory] = useState<NotificationHistoryEntry[]>([]);

  useEffect(() => {
    readHistory().then(setHistory);
  }, []);

  const clearHistory = useCallback(async () => {
    await writeHistory([]);
    setHistory([]);
  }, []);

  return { history, clearHistory };
}
