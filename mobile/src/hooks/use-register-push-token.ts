// Kullanıcı bildirim iznini kabul ederse bir Expo push token alıp
// `push_tokens` tablosuna kaydeden hook. Admin panel ileride bu token'lar
// üzerinden bildirim gönderecek.
//
// İzin reddedilirse, cihaz fiziksel bir cihaz değilse (simülatör/web) ya da
// Supabase yapılandırılmamışsa/kullanıcı oturum açmamışsa sessizce hiçbir
// şey yapmaz.

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export function useRegisterPushToken() {
  const { isConfigured, user } = useAuth();

  useEffect(() => {
    if (!isConfigured || !user) return;

    let isMounted = true;

    async function registerForPushNotifications() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('[useRegisterPushToken] Bildirim izni verilmedi.');
          return;
        }

        let tokenData: Notifications.ExpoPushToken;
        try {
          tokenData = await Notifications.getExpoPushTokenAsync();
        } catch (error) {
          console.warn('[useRegisterPushToken] Push token alınamadı:', error);
          return;
        }

        if (!isMounted || !user) return;

        const { error: upsertError } = await supabase
          .from('push_tokens')
          .upsert(
            { user_id: user.id, expo_push_token: tokenData.data },
            { onConflict: 'expo_push_token' }
          );

        if (upsertError) {
          console.warn('[useRegisterPushToken] Push token kaydedilemedi:', upsertError.message);
        }
      } catch (error) {
        console.warn('[useRegisterPushToken] Push token kaydı sırasında beklenmeyen hata:', error);
      }
    }

    registerForPushNotifications();

    return () => {
      isMounted = false;
    };
  }, [isConfigured, user]);
}
