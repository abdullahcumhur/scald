import { Image } from 'expo-image';
import { Dimensions, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);
const CARD_GAP = Spacing.three;

type AmbiancePhoto = {
  id: string;
  source: number;
  caption?: string;
};

// scaldcoffee.com ve Instagram'daki (@scald.coffee) resmi marka hesaplarından
// alınmış ortam fotoğrafları. mobile/assets/images/brand/ambiance/ altında
// bundle edilir.
const photos: AmbiancePhoto[] = [
  {
    id: 'cozy-corner',
    source: require('@/assets/images/brand/ambiance/interior-cozy-corner.jpg'),
    caption: 'Sıcak köşemiz',
  },
  {
    id: 'reading-nook',
    source: require('@/assets/images/brand/ambiance/interior-reading-nook.jpg'),
    caption: 'Kitaplık duvarı',
  },
  {
    id: 'gallery-wall',
    source: require('@/assets/images/brand/ambiance/interior-gallery-wall.jpg'),
    caption: 'Galeri duvarımız',
  },
  {
    id: 'outdoor-terrace',
    source: require('@/assets/images/brand/ambiance/outdoor-terrace.jpg'),
    caption: 'Teras keyfi',
  },
];

export function AmbianceGallery() {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold">Scald&apos;den Kareler</ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {photos.map((photo) => (
          <ThemedView key={photo.id} type="backgroundElement" style={styles.card}>
            <Image source={photo.source} style={styles.photo} contentFit="cover" transition={200} />
            {photo.caption && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.caption} numberOfLines={1}>
                {photo.caption}
              </ThemedText>
            )}
          </ThemedView>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  scrollContent: {
    gap: CARD_GAP,
    paddingRight: Spacing.four,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  photo: {
    width: CARD_WIDTH,
    height: 320,
  },
  caption: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
