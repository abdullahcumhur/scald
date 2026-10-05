// Sipariş Geçmişi — kullanıcının tamamlanmış/iptal edilmiş siparişlerini
// listeleyen ekran. `app-tabs.tsx`'te tanımlı değil, bu yüzden sekme çubuğunda
// görünmez; `profile.tsx`'ten `router.push('/order-history')` ile açılır.

import { Feather } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useProducts } from '@/hooks/use-supabase-data';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const HISTORY_STATUSES = ['completed', 'cancelled'] as const;

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number | string;
  quantity: number;
};

type HistoryOrderRow = {
  id: string;
  status: 'completed' | 'cancelled';
  total_amount: number | string;
  created_at: string;
  order_items: OrderItemRow[];
  locations: { name: string } | null;
};

type HistoryOrderItem = {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
};

type HistoryOrder = {
  id: string;
  status: HistoryOrderRow['status'];
  totalAmount: number;
  createdAt: string;
  locationName: string;
  items: HistoryOrderItem[];
};

function mapHistoryOrder(row: HistoryOrderRow): HistoryOrder {
  return {
    id: row.id,
    status: row.status,
    totalAmount: typeof row.total_amount === 'string' ? Number(row.total_amount) : row.total_amount,
    createdAt: row.created_at,
    locationName: row.locations?.name ?? '',
    items: row.order_items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.product_name,
      quantity: item.quantity,
    })),
  };
}

function statusLabel(status: HistoryOrder['status']): string {
  return status === 'completed' ? 'Tamamlandı' : 'İptal Edildi';
}

function statusColor(status: HistoryOrder['status']): string {
  return status === 'completed' ? '#2E7D32' : '#D3453B';
}

function statusIcon(status: HistoryOrder['status']): keyof typeof Feather.glyphMap {
  return status === 'completed' ? 'check-circle' : 'x-circle';
}

function statusBadgeBackground(status: HistoryOrder['status']): string {
  return status === 'completed' ? 'rgba(46,125,50,0.12)' : 'rgba(211,69,59,0.12)';
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('tr-TR');
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isConfigured, user } = useAuth();
  const { data: products } = useProducts();
  const { addItem } = useCart();

  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(isConfigured);

  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const loadOrders = useCallback(async () => {
    if (!isConfigured || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, order_items(*), locations(name)')
      .eq('user_id', user.id)
      .in('status', HISTORY_STATUSES)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[OrderHistoryScreen] Sipariş geçmişi sorgusu başarısız:', error.message);
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders(((data ?? []) as unknown as HistoryOrderRow[]).map(mapHistoryOrder));
    setLoading(false);
  }, [isConfigured, user]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  function handleReorder(order: HistoryOrder) {
    let addedCount = 0;
    let hasUnavailable = false;

    for (const item of order.items) {
      const product = item.productId ? productsById.get(item.productId) : undefined;
      if (!product) {
        hasUnavailable = true;
        continue;
      }
      for (let i = 0; i < item.quantity; i += 1) {
        addItem(product);
      }
      addedCount += 1;
    }

    if (hasUnavailable) {
      Alert.alert(
        'Bazı ürünler artık mevcut değil',
        addedCount > 0
          ? 'Hâlâ menüde olan ürünler sepete eklendi, diğerleri atlandı.'
          : 'Bu siparişteki ürünlerin hiçbiri artık menüde mevcut değil.'
      );
    }

    if (addedCount > 0) {
      router.push('/cart');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header} lightColor="transparent" darkColor="transparent">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>
            Sipariş Geçmişi
          </ThemedText>
        </ThemedView>

        {!isConfigured ? (
          <ThemedText type="small" themeColor="textSecondary">
            Bu özellik için Supabase yapılandırması gerekiyor.
          </ThemedText>
        ) : loading ? (
          <LoadingState />
        ) : orders.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Henüz geçmiş siparişin yok.
          </ThemedText>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}
            showsVerticalScrollIndicator={false}>
            {orders.map((order) => (
              <ThemedView key={order.id} type="backgroundElement" style={styles.card}>
                <ThemedView style={styles.cardHeader} lightColor="transparent" darkColor="transparent">
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDate(order.createdAt)}
                  </ThemedText>
                  <ThemedView
                    style={[styles.statusBadge, { backgroundColor: statusBadgeBackground(order.status) }]}>
                    <Feather name={statusIcon(order.status)} size={13} color={statusColor(order.status)} />
                    <ThemedText type="small" style={{ color: statusColor(order.status) }}>
                      {statusLabel(order.status)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {order.locationName ? (
                  <ThemedView style={styles.locationRow} lightColor="transparent" darkColor="transparent">
                    <Feather name="map-pin" size={13} color={theme.textSecondary} />
                    <ThemedText type="default">{order.locationName}</ThemedText>
                  </ThemedView>
                ) : null}

                <ThemedView style={styles.itemsList} lightColor="transparent" darkColor="transparent">
                  {order.items.map((item) => (
                    <ThemedText key={item.id} type="small" themeColor="textSecondary">
                      {item.name} x {item.quantity}
                    </ThemedText>
                  ))}
                </ThemedView>

                <ThemedView style={styles.totalRow} lightColor="transparent" darkColor="transparent">
                  <ThemedText type="smallBold">Toplam</ThemedText>
                  <ThemedText type="smallBold">{order.totalAmount}₺</ThemedText>
                </ThemedView>

                <Pressable
                  onPress={() => handleReorder(order)}
                  style={({ pressed }) => [
                    styles.reorderButton,
                    { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
                  ]}>
                  <Feather name="refresh-cw" size={15} color="#ffffff" />
                  <ThemedText type="smallBold" style={styles.reorderButtonText}>
                    Tekrar Sipariş Ver
                  </ThemedText>
                </Pressable>
              </ThemedView>
            ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  list: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  itemsList: {
    gap: Spacing.half,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Radius.button,
  },
  reorderButtonText: {
    color: '#ffffff',
  },
});
