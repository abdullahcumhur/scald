import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Ana Sayfa</TabButton>
          </TabTrigger>
          <TabTrigger name="menu" href="/menu" asChild>
            <TabButton>Menü</TabButton>
          </TabTrigger>
          <TabTrigger name="cart" href="/cart" asChild>
            <TabButton>Sipariş</TabButton>
          </TabTrigger>
          <TabTrigger name="scald-club" href="/scald-club" asChild>
            <TabButton>Scald Club</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

// Bottom nav bar — 5 sekme, her biri eşit genişlikte (flex: 1) alıyor ki geniş
// masaüstü penceresinde de dar telefon ekranında da satır taşmadan tam sığsın.
// Eskiden burada ayrıca bir "Scald Coffee" marka metni vardı; alt bar artık üst
// header'daki logoyla birlikte kullanıldığı için gereksiz yer kaplıyordu, kaldırıldı.
export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabButtonWrap, pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        lightColor={isFocused ? undefined : 'transparent'}
        darkColor={isFocused ? undefined : 'transparent'}
        style={styles.tabButtonView}>
        <ThemedText
          type="small"
          themeColor={isFocused ? 'primary' : 'textSecondary'}
          numberOfLines={1}
          style={styles.tabButtonText}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View style={styles.tabListOuter}>
      <ThemedView type="backgroundElement" style={styles.tabListContainer}>
        <SafeAreaView edges={['bottom']} {...props} style={styles.innerContainer} />
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListOuter: {
    width: '100%',
    alignItems: 'center',
  },
  tabListContainer: {
    width: '100%',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    maxWidth: MaxContentWidth,
  },
  innerContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonWrap: {
    flex: 1,
  },
  tabButtonView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.half,
    marginHorizontal: Spacing.half,
    borderRadius: Spacing.three,
  },
  tabButtonText: {
    fontSize: 12,
    lineHeight: 15,
  },
});
