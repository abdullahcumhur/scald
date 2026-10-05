// Sipariş Geçmişi — kullanıcının tamamlanmış/iptal edilmiş siparişlerini
// listeleyen ekran. `app-tabs.tsx`'te tanımlı değil, bu yüzden sekme çubuğunda
// görünmez; `profile.tsx`'ten `router.push('/order-history')` ile açılır.

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

const HISTORY_STATUSES = ['completed', 'cancelled'] as const;

type OrderItemRow = {
  id: string;
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

type HistoryOrder = {
  id: string;
  status: HistoryOrderRow['status'];
  totalAmount: number;
  createdAt: string;
  locationName: string;
  items: { id: string; name: string; quantity: number }[];
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

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('tr-TR');
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { isConfigured, user } = useAuth();

  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(isConfigured);

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <ThemedText type="title" themeColor="primary" style={styles.backIcon}>
              ‹
            </ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Sipariş Geçmişi
          </ThemedText>
        </ThemedView>

        {!isConfigured ? (
          <ThemedText type="small" themeColor="textSecondary">
            Bu özellik için Supabase yapılandırması gerekiyor.
          </ThemedText>
        ) : loading ? (
          <ThemedText type="small" themeColor="textSecondary">
            Yükleniyor...
          </ThemedText>
        ) : orders.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Henüz geçmiş siparişin yok.
          </ThemedText>
        ) : (
          <ScrollView contentContainerStyle={[styles.list, { paddingBottom: BottomTabInset }]}>
            {orders.map((order) => (
              <ThemedView key={order.id} type="backgroundElement" style={styles.card}>
                <ThemedView style={styles.cardHeader}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDate(order.createdAt)}
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: statusColor(order.status) }}>
                    {statusLabel(order.status)}
                  </ThemedText>
                </ThemedView>

                {order.locationName ? <ThemedText type="default">{order.locationName}</ThemedText> : null}

                <ThemedView style={styles.itemsList}>
                  {order.items.map((item) => (
                    <ThemedText key={item.id} type="small" themeColor="textSecondary">
                      {item.name} x {item.quantity}
                    </ThemedText>
                  ))}
                </ThemedView>

                <ThemedView style={styles.totalRow}>
                  <ThemedText type="smallBold">Toplam</ThemedText>
                  <ThemedText type="smallBold">{order.totalAmount}₺</ThemedText>
                </ThemedView>
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
    gap: Spacing.two,
    paddingTop: Spacing.three,
    backgroundColor: 'transparent',
  },
  backButton: {
    paddingRight: Spacing.one,
  },
  backIcon: {
    fontSize: 32,
    lineHeight: 36,
  },
  title: {
    flex: 1,
    fontSize: 32,
    lineHeight: 38,
  },
  list: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  itemsList: {
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
    backgroundColor: 'transparent',
  },
});
