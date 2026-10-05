// "Sırasız Teslim Al" (Faz 2.5) — Sepet / Rezervasyon ekranı.
//
// Kullanıcının aktif bir siparişi (pending/preparing/ready) varsa, sepet
// yerine o siparişin teslim kodunu ve durumunu gösterir. Aktif sipariş yoksa
// sepet içeriğini, şube + tahmini süre seçimini ve "Rezervasyonu Oluştur"
// butonunu gösterir. Ödeme mağazada yapılır; bu ekran yalnızca rezervasyon
// oluşturur.

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { LoadingState } from '@/components/loading-state';
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

function CartHeader({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <ThemedView type="primary" style={styles.header}>
      <SafeAreaView edges={['top']}>
        <ThemedView type="primary" style={styles.headerRow}>
          <Ionicons name={icon} size={20} color="#ffffff" />
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {title}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

export default function CartScreen() {
  const theme = useTheme();
  const { isConfigured, user } = useAuth();
  const { items, removeItem, updateQuantity, clear, totalPrice } = useCart();
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

    const { data: order, error: createOrderError } = await supabase.rpc('create_order', {
      p_location_id: selectedLocationId,
      p_requested_minutes: requestedMinutes,
      p_items: items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        unit_price: item.product.price,
        quantity: item.quantity,
      })),
    });

    if (createOrderError || !order) {
      setError(createOrderError?.message ?? 'Rezervasyon oluşturulamadı.');
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
        <CartHeader title="Sepet" icon="cart" />
        <ThemedView style={styles.body}>
          <ThemedText type="small" themeColor="textSecondary">
            Bu özellik için Supabase yapılandırması gerekiyor.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (activeOrderLoading) {
    return (
      <ThemedView style={styles.container}>
        <CartHeader title="Sepet" icon="cart" />
        <ThemedView style={styles.body}>
          <LoadingState />
        </ThemedView>
      </ThemedView>
    );
  }

  if (activeOrder) {
    return (
      <ThemedView style={styles.container}>
        <CartHeader title="Siparişin" icon="receipt" />

        <ThemedView style={styles.body}>
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}
            showsVerticalScrollIndicator={false}>
            <ThemedView type="backgroundElement" style={styles.pickupCard}>
              <ThemedView type="backgroundSelected" style={styles.pickupIconWrap}>
                <Ionicons
                  name={activeOrder.status === 'ready' ? 'checkmark-circle' : 'time'}
                  size={30}
                  color={theme.primary}
                />
              </ThemedView>
              <ThemedText type="small" themeColor="textSecondary">
                Teslim Kodun
              </ThemedText>
              <ThemedText type="title" themeColor="primary" style={styles.pickupCode}>
                {activeOrder.pickupCode}
              </ThemedText>
              <ThemedView type="backgroundSelected" style={styles.statusPill}>
                <ThemedText type="smallBold" themeColor="primary">
                  {statusLabel(activeOrder.status)}
                </ThemedText>
              </ThemedView>
              {activeOrder.locationName ? (
                <ThemedView style={styles.infoRow} lightColor="transparent" darkColor="transparent">
                  <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {activeOrder.locationName}
                  </ThemedText>
                </ThemedView>
              ) : null}
              <ThemedView style={styles.infoRow} lightColor="transparent" darkColor="transparent">
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Tahmini süre: {activeOrder.requestedMinutes} dk
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeaderRow} lightColor="transparent" darkColor="transparent">
                <Ionicons name="receipt-outline" size={16} color={theme.text} />
                <ThemedText type="smallBold">Sipariş Kalemleri</ThemedText>
              </ThemedView>
              {activeOrder.items.map((item) => (
                <ThemedView key={item.id} type="backgroundElement" style={styles.itemRow}>
                  <ThemedView style={styles.itemInfo} lightColor="transparent" darkColor="transparent">
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
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CartHeader title="Sepet" icon="cart" />

      <ThemedView style={styles.body}>
        {items.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sepetin boş. Menüden ürün ekleyerek başlayabilirsin.
          </ThemedText>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}
            showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeaderRow} lightColor="transparent" darkColor="transparent">
                <Ionicons name="cart-outline" size={16} color={theme.text} />
                <ThemedText type="smallBold">Ürünler</ThemedText>
              </ThemedView>
              {items.map((item) => (
                <ThemedView key={item.product.id} type="backgroundElement" style={styles.itemRow}>
                  <ThemedView style={styles.itemInfo} lightColor="transparent" darkColor="transparent">
                    <ThemedText type="default">{item.product.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.product.price}₺ / adet
                    </ThemedText>
                    <Pressable onPress={() => removeItem(item.product.id)}>
                      <ThemedText type="small" style={styles.removeText}>
                        Kaldır
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                  <ThemedView style={styles.itemActions} lightColor="transparent" darkColor="transparent">
                    <ThemedView style={styles.stepper} lightColor="transparent" darkColor="transparent">
                      <Pressable
                        onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                        hitSlop={8}
                        style={[styles.stepperButton, { backgroundColor: theme.backgroundSelected }]}>
                        <Ionicons name="remove" size={15} color={theme.primary} />
                      </Pressable>
                      <ThemedText type="smallBold" style={styles.stepperValue}>
                        {item.quantity}
                      </ThemedText>
                      <Pressable
                        onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                        hitSlop={8}
                        style={[styles.stepperButton, { backgroundColor: theme.backgroundSelected }]}>
                        <Ionicons name="add" size={15} color={theme.primary} />
                      </Pressable>
                    </ThemedView>
                    <ThemedText type="smallBold">{item.product.price * item.quantity}₺</ThemedText>
                  </ThemedView>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.totalRow}>
              <ThemedText type="smallBold">Toplam</ThemedText>
              <ThemedText type="smallBold">{totalPrice}₺</ThemedText>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeaderRow} lightColor="transparent" darkColor="transparent">
                <Ionicons name="location-outline" size={16} color={theme.text} />
                <ThemedText type="smallBold">Şube Seç</ThemedText>
              </ThemedView>
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
              <ThemedView style={styles.sectionHeaderRow} lightColor="transparent" darkColor="transparent">
                <Ionicons name="time-outline" size={16} color={theme.text} />
                <ThemedText type="smallBold">Tahmini Süre</ThemedText>
              </ThemedView>
              <ThemedView style={styles.minutesRow} lightColor="transparent" darkColor="transparent">
                {REQUESTED_MINUTES_OPTIONS.map((minutes) => {
                  const isSelected = minutes === requestedMinutes;
                  return (
                    <Pressable key={minutes} onPress={() => setRequestedMinutes(minutes)} style={styles.minuteButtonWrapper}>
                      <ThemedView
                        type={isSelected ? 'primary' : 'backgroundElement'}
                        style={styles.minuteButton}>
                        <ThemedText
                          type="smallBold"
                          style={isSelected ? styles.minuteButtonTextActive : undefined}
                          themeColor={isSelected ? undefined : 'textSecondary'}>
                          {minutes} dk
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>
            </ThemedView>

            {error && (
              <ThemedView style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#D3453B" />
                <ThemedText type="small" style={styles.errorText}>
                  {error}
                </ThemedText>
              </ThemedView>
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
              {!submitting && <Ionicons name="arrow-forward" size={18} color="#ffffff" />}
            </Pressable>
          </ScrollView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: Spacing.five,
    borderBottomRightRadius: Spacing.five,
    paddingBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  headerTitle: {
    color: '#ffffff',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 20,
    textAlign: 'center',
  },
  removeText: {
    color: '#D3453B',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.four,
    padding: Spacing.three,
  },
  locationRow: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  minutesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  minuteButtonWrapper: {
    flex: 1,
  },
  minuteButton: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  minuteButtonTextActive: {
    color: '#ffffff',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(211,69,59,0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  errorText: {
    flex: 1,
    color: '#D3453B',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
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
  pickupIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  pickupCode: {
    letterSpacing: 4,
  },
  statusPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
    marginTop: Spacing.half,
    marginBottom: Spacing.one,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
