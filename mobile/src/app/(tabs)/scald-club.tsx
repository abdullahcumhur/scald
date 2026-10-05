// Scald Club — kahve damgası sisteminin kendine ait sekmesi. Ana sayfadaki
// `coffee-stamp-card.tsx` küçük/özet bir önizleme gösteriyor; burası aynı
// mekaniğin (bkz. backend/supabase/migrations/0008_coffee_stamps.sql,
// mobile/src/lib/auth-context.tsx) geçmişi, ödül listesi ve kendi kendine
// ücretsiz kahve kullanma akışıyla birlikte tam ekran hali.

import { useCallback, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const STAMPS_GOAL = 6;

type StampTransactionType = 'stamp' | 'redeem_free_coffee';

type StampTransactionRow = {
  id: string;
  type: StampTransactionType;
  note: string | null;
  created_at: string;
};

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('tr-TR');
}

export default function ScaldClubScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isConfigured, user, profile, refreshProfile } = useAuth();

  const [history, setHistory] = useState<StampTransactionRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(isConfigured);
  const [redeeming, setRedeeming] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isConfigured || !user) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('coffee_stamp_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[ScaldClubScreen] Geçmiş sorgusu başarısız:', error.message);
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    setHistory((data ?? []) as StampTransactionRow[]);
    setHistoryLoading(false);
  }, [isConfigured, user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleRedeem = useCallback(async () => {
    if (!isConfigured || !user || redeeming) return;

    setRedeeming(true);
    const { error } = await supabase
      .from('coffee_stamp_transactions')
      .insert({ user_id: user.id, type: 'redeem_free_coffee' });

    if (error) {
      // free_coffees >= 0 CHECK constraint'i, iki cihazdan aynı anda
      // kullanmaya çalışma gibi bir yarış durumunda insert'i reddedebilir —
      // kullanıcıya teknik hata metni yerine anlaşılır bir mesaj gösteriyoruz.
      console.warn('[ScaldClubScreen] Ücretsiz kahve kullanılamadı:', error.message);
      Alert.alert(
        'Bir sorun oluştu',
        'Ücretsiz kahve şu anda kullanılamadı. Lütfen tekrar dene veya kasada barista ile görüş.'
      );
      setRedeeming(false);
      return;
    }

    await Promise.all([refreshProfile(), loadHistory()]);
    setRedeeming(false);
  }, [isConfigured, user, redeeming, refreshProfile, loadHistory]);

  const stamps = isConfigured ? profile?.coffeeStamps ?? 0 : 0;
  const freeCoffees = isConfigured ? profile?.freeCoffees ?? 0 : 0;
  const clampedStamps = Math.min(Math.max(stamps, 0), STAMPS_GOAL);
  const remaining = Math.max(STAMPS_GOAL - clampedStamps, 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              SCALD CLUB
            </ThemedText>
            <ThemedText type="title" style={styles.pageTitle}>
              Kahve Kartım
            </ThemedText>
          </View>

          {/* Hero: ilerleme */}
          <ThemedView type="backgroundElement" style={[styles.heroCard, { borderRadius: Radius.loyalty }]}>
            <View style={styles.heroTopRow}>
              <View style={[styles.heroIconBadge, { backgroundColor: theme.backgroundSelected }]}>
                <Feather name="coffee" size={22} color={theme.primary} />
              </View>
              <ThemedText type="title" style={styles.heroCount}>
                {clampedStamps}
                <ThemedText type="subtitle" themeColor="textSecondary">
                  {' '}
                  / {STAMPS_GOAL}
                </ThemedText>
              </ThemedText>
            </View>

            <View style={styles.dotsRow}>
              {Array.from({ length: STAMPS_GOAL }).map((_, index) => {
                const filled = index < clampedStamps;
                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      filled
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: 'transparent', borderColor: theme.backgroundSelected },
                    ]}
                  />
                );
              })}
            </View>

            {remaining > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {remaining} kahve daha
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Bir sonraki ücretsiz kahven yolda!
              </ThemedText>
            )}

            {freeCoffees > 0 && (
              <View style={[styles.celebrateBanner, { backgroundColor: theme.backgroundSelected }]}>
                <Feather name="gift" size={18} color={theme.primary} />
                <ThemedText type="smallBold" themeColor="primary" style={styles.celebrateText}>
                  {freeCoffees} ücretsiz kahve hakkın hazır — aşağıdan kullanabilirsin.
                </ThemedText>
              </View>
            )}
          </ThemedView>

          {/* Sonraki ödül */}
          <View style={styles.sectionHeader}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              SONRAKİ ÖDÜL
            </ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={[styles.nextRewardCard, { borderRadius: Radius.card }]}>
            <View style={[styles.rewardIconBadge, { backgroundColor: theme.backgroundSelected }]}>
              <Feather name="coffee" size={20} color={theme.primary} />
            </View>
            <View style={styles.rewardTextGroup}>
              <ThemedText type="smallBold">Ücretsiz kahve</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Her 6 damgada 1 kahve bizden hediye.
              </ThemedText>
            </View>
          </ThemedView>

          {/* Ödüllerim */}
          <View style={styles.sectionHeader}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              ÖDÜLLERİM
            </ThemedText>
          </View>

          {isConfigured && user && freeCoffees > 0 ? (
            <View style={styles.rewardsList}>
              {Array.from({ length: freeCoffees }).map((_, index) => (
                <ThemedView
                  key={index}
                  type="backgroundElement"
                  style={[styles.rewardRow, { borderRadius: Radius.card }]}>
                  <View style={[styles.rewardIconBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <Feather name="gift" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.rewardTextGroup}>
                    <ThemedText type="smallBold">Ücretsiz kahve</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Kullanmaya hazır
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={handleRedeem}
                    disabled={redeeming}
                    style={[styles.redeemButton, { backgroundColor: theme.primary, opacity: redeeming ? 0.6 : 1 }]}>
                    <ThemedText type="smallBold" style={styles.redeemButtonText}>
                      {redeeming ? '...' : 'Kullan'}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ))}
            </View>
          ) : (
            <ThemedView
              type="backgroundElement"
              style={[styles.rewardRow, styles.lockedRow, { borderRadius: Radius.card, borderColor: theme.backgroundSelected }]}>
              <View style={[styles.rewardIconBadge, { backgroundColor: theme.backgroundSelected }]}>
                <Feather name="lock" size={18} color={theme.textSecondary} />
              </View>
              <View style={styles.rewardTextGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Ücretsiz kahve
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {isConfigured && user
                    ? `${remaining > 0 ? remaining : STAMPS_GOAL} damga daha gerekli`
                    : 'Bu özelliği kullanmak için giriş yapmalısın'}
                </ThemedText>
              </View>
            </ThemedView>
          )}

          {/* Geçmiş */}
          <View style={styles.sectionHeader}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              GEÇMİŞ
            </ThemedText>
          </View>

          {!isConfigured ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionNote}>
              Bu özellik için Supabase yapılandırması gerekiyor.
            </ThemedText>
          ) : !user ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionNote}>
              Geçmişini görmek için giriş yapmalısın.
            </ThemedText>
          ) : historyLoading ? (
            <LoadingState label="Geçmiş yükleniyor..." />
          ) : history.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionNote}>
              Henüz hiçbir hareketin yok.
            </ThemedText>
          ) : (
            <View style={styles.historyList}>
              {history.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View style={[styles.historyIconBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <Feather
                      name={item.type === 'stamp' ? 'coffee' : 'gift'}
                      size={16}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.historyTextGroup}>
                    <ThemedText type="small">
                      {item.type === 'stamp' ? 'Kahve damgası kazandın' : 'Ücretsiz kahve kullandın'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatDate(item.created_at)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Kampanyalar */}
          <Pressable onPress={() => router.push('/')} style={styles.campaignsLink}>
            <ThemedText type="small" themeColor="textSecondary">
              Güncel kampanyaları ana sayfada incele
            </ThemedText>
            <Feather name="arrow-right" size={14} color={theme.textSecondary} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    gap: Spacing.half,
  },
  eyebrow: {
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
  heroCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCount: {
    fontSize: 36,
    lineHeight: 42,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  celebrateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  celebrateText: {
    flex: 1,
  },
  sectionHeader: {
    marginTop: Spacing.two,
  },
  nextRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  rewardIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTextGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  rewardsList: {
    gap: Spacing.two,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  lockedRow: {
    borderWidth: 1,
    opacity: 0.7,
  },
  redeemButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.button,
  },
  redeemButtonText: {
    color: '#FFFFFF',
  },
  historyList: {
    gap: Spacing.three,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  historyIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  sectionNote: {
    paddingVertical: Spacing.two,
  },
  campaignsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
});
