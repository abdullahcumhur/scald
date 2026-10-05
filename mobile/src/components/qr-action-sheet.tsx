// QR ile masadan sipariş akışı — DEMO/MOCK.
//
// Gerçek bir masa/şube algılama backend'i henüz yok, bu yüzden bu bileşen
// bilinçli olarak sahte bir akış sunar: "QR Tara" → kısa bir "taranıyor..."
// yükleme durumu (gerçek kamera yerine setTimeout) → `useLocations()`'tan
// gelen ilk şube "algılanan şube" olarak gösterilir → "Masanda mısın?"
// sorusu. "Evet" kullanıcıyı sepet/sipariş ekranına yönlendirir (masadan
// sipariş akışının gerçek mantığı o ekranın sorumluluğunda); "Hayır" sadece
// sheet'i kapatır.
//
// İleride gerçek bir barkod/QR okuyucuya (örn. `expo-camera`'nın
// `CameraView` + `barcodeScannerSettings` API'si) bağlanmaya hazır: `open()`
// çağrısından önce kamera izni istenip taranan QR içeriğinden şube/masa id'si
// çözülecek şekilde genişletilebilir. Bu dosya o native kamera/izin işini
// kapsamıyor — sadece akışın UI iskeletini sağlıyor.

import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useLocations } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';

// Mock "tarama" süresi — gerçek kamera entegrasyonunda yerini barkod
// okuma event'i alacak.
const MOCK_SCAN_DURATION_MS = 1500;

type QrActionSheetProps = {
  // Varsayılan tetikleyici (alttaki "Masada mısın?" kartı) bu ekranın
  // ihtiyacına uygun; farklı bir ekran (örn. ana sayfa üst-sağ QR ikonu)
  // kendi tetikleyici görünümünü verebilir — bileşen sheet mantığını
  // kapsüllediği için nereden tetiklendiği önemli değil.
  trigger?: (open: () => void) => ReactNode;
};

export function QrActionSheet({ trigger }: QrActionSheetProps) {
  const router = useRouter();
  const theme = useTheme();
  const { data: locations } = useLocations();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'scanning' | 'detected'>('scanning');

  // Demo amaçlı: "algılanan" şube olarak gerçek veriden ilk şubeyi kullanıyoruz.
  const detectedLocation = locations[0];

  const open = useCallback(() => {
    setStep('scanning');
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  // Mock "tarama" gecikmesi, sheet görünür ve "scanning" adımındayken
  // tetiklenir; sheet kapanır ya da yeniden açılırsa zamanlayıcı temizlenir.
  // Gerçek bir kamera/barkod entegrasyonunda bu effect'in yerini barkod
  // okunduğunda gelen bir event alacak.
  useEffect(() => {
    if (!visible || step !== 'scanning') return;

    const timeout = setTimeout(() => {
      setStep('detected');
    }, MOCK_SCAN_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [visible, step]);

  const handleConfirm = useCallback(() => {
    close();
    router.push('/cart');
  }, [close, router]);

  return (
    <>
      {trigger ? trigger(open) : <DefaultTrigger onPress={open} />}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}
            // İçerideki dokunuşların backdrop'a düşüp sheet'i kapatmasını engeller.
            onPress={(event) => event.stopPropagation()}>
            {step === 'scanning' ? (
              <ThemedView lightColor="transparent" darkColor="transparent" style={styles.scanningContent}>
                <ActivityIndicator color={theme.primary} size="large" />
                <ThemedText type="subtitle" style={styles.sheetTitle}>
                  Taranıyor...
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.sheetBody}>
                  QR kod okunuyor, lütfen bekle.
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView lightColor="transparent" darkColor="transparent" style={styles.detectedContent}>
                <ThemedView style={[styles.detectedIcon, { backgroundColor: theme.backgroundSelected }]}>
                  <Feather name="map-pin" size={22} color={theme.primary} />
                </ThemedView>

                <ThemedText type="small" themeColor="textSecondary">
                  Algılanan şube
                </ThemedText>
                <ThemedText type="subtitle" style={styles.sheetTitle}>
                  {detectedLocation?.name ?? 'Scald Coffee & Patisserie'}
                </ThemedText>

                <ThemedText type="default" style={styles.question}>
                  Masanda mısın?
                </ThemedText>

                <ThemedView lightColor="transparent" darkColor="transparent" style={styles.actionsRow}>
                  <Pressable
                    onPress={close}
                    style={[styles.actionButton, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="smallBold">Hayır</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirm}
                    style={[styles.actionButton, styles.primaryAction, { backgroundColor: theme.primary }]}>
                    <ThemedText type="smallBold" style={styles.primaryActionText}>
                      Evet, Masadan Sipariş Ver
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function DefaultTrigger({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.triggerCard}>
      <ThemedView style={[styles.triggerIcon, { backgroundColor: theme.backgroundSelected }]}>
        <MaterialIcons name="qr-code-scanner" size={20} color={theme.primary} />
      </ThemedView>
      <ThemedView style={styles.triggerTextGroup} lightColor="transparent" darkColor="transparent">
        <ThemedText type="smallBold">Masada mısın?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          QR ile sipariş ver
        </ThemedText>
      </ThemedView>
      <Pressable onPress={onPress} style={[styles.triggerButton, { backgroundColor: theme.primary }]}>
        <Feather name="camera" size={14} color="#ffffff" />
        <ThemedText type="smallBold" style={styles.triggerButtonText}>
          QR Tara
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  triggerIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTextGroup: {
    flex: 1,
    gap: 2,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  triggerButtonText: {
    color: '#ffffff',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,10,10,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.hero,
    borderTopRightRadius: Radius.hero,
    padding: Spacing.five,
    paddingBottom: Spacing.six * 0.6,
    gap: Spacing.two,
  },
  scanningContent: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  detectedContent: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  detectedIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.loyalty,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  sheetTitle: {
    textAlign: 'center',
  },
  sheetBody: {
    textAlign: 'center',
  },
  question: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.two,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.button,
  },
  primaryAction: {
    flex: 1.4,
  },
  primaryActionText: {
    color: '#ffffff',
  },
});
