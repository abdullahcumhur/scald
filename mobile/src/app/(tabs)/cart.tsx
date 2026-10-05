// "Sırasız Teslim Al" (Faz 2.5) — Sepet / Rezervasyon ekranı.
//
// Kullanıcının aktif bir siparişi (pending/preparing/ready) varsa, sepet
// yerine o siparişin teslim kodunu ve durumunu gösterir. Aktif sipariş yoksa
// sepet içeriğini, şube + tahmini süre seçimini ve "Rezervasyonu Oluştur"
// butonunu gösterir. Ödeme mağazada yapılır; bu ekran yalnızca rezervasyon
// oluşturur.

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLocations } from '@/hooks/use-supabase-data';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';

const REQUESTED_MINUTES_OPTIONS = [10, 20, 30] as const;

const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'] as const;

type OrderItemRow = {
  id: string;
  product_name: string;
  unit_price: number | string;
  quantity: number;
};

type ActiveOrderRow = {
  id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  pickup_code: string;
  requested_minutes: number;
  total_amount: number | string;
  order_items: OrderItemRow[];
  locations: { name: string } | null;
};

type ActiveOrder = {
  id: string;
  status: ActiveOrderRow['status'];
  pickupCode: string;
  requestedMinutes: number;
  totalAmount: number;
  locationName: string;
  items: { id: string; name: string; unitPrice: number; quantity: number }[];
};

function mapActiveOrder(row: ActiveOrderRow): ActiveOrder {
  return {
    id: row.id,
    status: row.status,
    pickupCode: row.pickup_code,
    requestedMinutes: row.requested_minutes,
    totalAmount: typeof row.total_amount === 'string' ? Number(row.total_amount) : row.total_amount,
    locationName: row.locations?.name ?? '',
    items: row.order_items.map((item) => ({
      id: item.id,
      name: item.product_name,
      unitPrice: typeof item.unit_price === 'string' ? Number(item.unit_price) : item.unit_price,
      quantity: item.quantity,
    })),
  };
}

function statusLabel(status: ActiveOrder['status']): string {
  switch (status) {
    case 'pending':
      return 'Beklemede';
    case 'preparing':
      return 'Hazırlanıyor';
    case 'ready':
      return 'Hazır, gel al!';
    default:
      return status;
  }
}

export default function CartScreen() {
  const theme = useTheme();
  const { isConfigured, user } = useAuth();
  const { items, removeItem, clear, totalPrice } = useCart();
  const { data: locations, loading: locationsLoading } = useLocations();

  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [activeOrderLoading, setActiveOrderLoading] = useState(isConfigured);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [requestedMinutes, setRequestedMinutes] = useState<number>(REQUESTED_MINUTES_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveOrder = useCallback(async () => {
    if (!isConfigured || !user) {
      setActiveOrderLoading(false);
      return;
    }

    setActiveOrderLoading(true);
    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id, status, pickup_code, requested_minutes, total_amount, order_items(*), locations(name)')
      .eq('user_id', user.id)
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.warn('[CartScreen] Aktif sipariş sorgusu başarısız:', queryError.message);
      setActiveOrder(null);
      setActiveOrderLoading(false);
      return;
    }

    setActiveOrder(data ? mapActiveOrder(data as unknown as ActiveOrderRow) : null);
    setActiveOrderLoading(false);
  }, [isConfigured, user]);

  useFocusEffect(
    useCallback(() => {
      loadActiveOrder();
    }, [loadActiveOrder])
  );

  async function handleSubmit() {
    if (!user || !selectedLocationId || items.length === 0) return;

    setSubmitting(true);
    setError(null);

    const { data: order, error: insertOrderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        location_id: selectedLocationId,
        requested_minutes: requestedMinutes,
        total_amount: totalPrice,
        note: null,
      })
      .select()
      .single();

    if (insertOrderError || !order) {
      setError(insertOrderError?.message ?? 'Rezervasyon oluşturulamadı.');
      setSubmitting(false);
      return;
    }

    const { error: insertItemsError } = await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        unit_price: item.product.price,
        quantity: item.quantity,
      }))
    );

    if (insertItemsError) {
      setError(insertItemsError.message);
      setSubmitting(false);
      return;
    }

    clear();
    setSubmitting(false);
    await loadActiveOrder();
  }

  if (!isConfigured) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ThemedText type="title" style={styles.title}>
            Sepet
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Bu özellik için Supabase yapılandırması gerekiyor.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (activeOrderLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ThemedText type="title" style={styles.title}>
            Sepet
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Yükleniyor...
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (activeOrder) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ThemedText type="title" style={styles.title}>
            Siparişin
          </ThemedText>

          <ScrollView contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}>
            <ThemedView type="backgroundElement" style={styles.pickupCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Teslim Kodun
              </ThemedText>
              <ThemedText type="title" themeColor="primary" style={styles.pickupCode}>
                {activeOrder.pickupCode}
              </ThemedText>
              <ThemedText type="subtitle">{statusLabel(activeOrder.status)}</ThemedText>
              {activeOrder.locationName ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {activeOrder.locationName}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                Tahmini süre: {activeOrder.requestedMinutes} dk
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">Sipariş Kalemleri</ThemedText>
              {activeOrder.items.map((item) => (
                <ThemedView key={item.id} type="backgroundElement" style={styles.itemRow}>
                  <ThemedView style={styles.itemInfo}>
                    <ThemedText type="default">{item.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.quantity} adet
                    </ThemedText>
                  </ThemedView>
                  <ThemedText type="smallBold">{item.unitPrice * item.quantity}₺</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.totalRow}>
              <ThemedText type="smallBold">Toplam</ThemedText>
              <ThemedText type="smallBold">{activeOrder.totalAmount}₺</ThemedText>
            </ThemedView>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Sepet
        </ThemedText>

        {items.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sepetin boş. Menüden ürün ekleyerek başlayabilirsin.
          </ThemedText>
        ) : (
          <ScrollView contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}>
            <ThemedView style={styles.section}>
              {items.map((item) => (
                <ThemedView key={item.product.id} type="backgroundElement" style={styles.itemRow}>
                  <ThemedView style={styles.itemInfo}>
                    <ThemedText type="default">{item.product.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.quantity} adet × {item.product.price}₺
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.itemActions}>
                    <ThemedText type="smallBold">{item.product.price * item.quantity}₺</ThemedText>
                    <Pressable onPress={() => removeItem(item.product.id)}>
                      <ThemedText type="small" style={styles.removeText}>
                        Kaldır
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.totalRow}>
              <ThemedText type="smallBold">Toplam</ThemedText>
              <ThemedText type="smallBold">{totalPrice}₺</ThemedText>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">Şube Seç</ThemedText>
              {locationsLoading ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Yükleniyor...
                </ThemedText>
              ) : (
                locations.map((location) => {
                  const isSelected = location.id === selectedLocationId;
                  return (
                    <Pressable key={location.id} onPress={() => setSelectedLocationId(location.id)}>
                      <ThemedView
                        type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                        style={styles.locationRow}>
                        <ThemedText type="default">{location.name}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {location.address}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })
              )}
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="smallBold">Tahmini Süre</ThemedText>
              <ThemedView style={styles.minutesRow}>
                {REQUESTED_MINUTES_OPTIONS.map((minutes) => {
                  const isSelected = minutes === requestedMinutes;
                  return (
                    <Pressable key={minutes} onPress={() => setRequestedMinutes(minutes)} style={styles.minuteButtonWrapper}>
                      <ThemedView
                        type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                        style={styles.minuteButton}>
                        <ThemedText type="smallBold" themeColor={isSelected ? 'text' : 'textSecondary'}>
                          {minutes} dk
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>
            </ThemedView>

            {error && (
              <ThemedText type="small" style={styles.errorText}>
                {error}
              </ThemedText>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !selectedLocationId}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed || submitting || !selectedLocationId ? 0.6 : 1,
                },
              ]}>
              <ThemedText type="smallBold" style={styles.submitButtonText}>
                {submitting ? 'Oluşturuluyor...' : 'Rezervasyonu Oluştur'}
              </ThemedText>
            </Pressable>
          </ScrollView>
        )}
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    paddingTop: Spacing.three,
  },
  list: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  removeText: {
    color: '#D3453B',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  locationRow: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  minutesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  minuteButtonWrapper: {
    flex: 1,
  },
  minuteButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  errorText: {
    color: '#D3453B',
  },
  submitButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
  },
  pickupCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
    alignItems: 'center',
  },
  pickupCode: {
    letterSpacing: 4,
  },
});
