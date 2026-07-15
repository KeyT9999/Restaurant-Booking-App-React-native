import React from 'react';
import { StyleSheet, Text, View, Image, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { T } from '@/src/theme/tokens';
import { Restaurant } from '@/src/types/restaurant.types';
import { formatPriceRange } from '@/src/utils/format';
import { Rating } from '@/src/components/ui/Rating';
import { shadows } from '@/src/theme/shadows';
import { getRestaurantId } from '@/src/utils/restaurant';

export type RestaurantCardVariant = 'featured' | 'horizontal' | 'compact';

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: RestaurantCardVariant;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  variant = 'horizontal',
  onPress,
  style,
}) => {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const restaurantId = getRestaurantId(restaurant);

  const handlePress = () => {
    if (__DEV__) {
      console.log('[RestaurantCard] press', {
        id: restaurantId,
        name: restaurant?.name,
        target: `/restaurants/${restaurantId}`,
      });
    }

    if (onPress) {
      onPress();
      return;
    }

    if (!restaurantId) {
      console.warn('[RestaurantCard] Missing restaurant id', restaurant);
      return;
    }

    router.push({
      pathname: '/restaurants/[id]',
      params: { id: restaurantId },
    });
  };

  // Normalize ảnh: hỗ trợ cả shape recommendation (image) lẫn detail API (coverImage, logo)
  const r = restaurant as any;
  const imageUrl =
    r.coverImage ||
    r.image ||
    r.primaryImage ||
    r.logo ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500';

  // Normalize rating: hỗ trợ cả stats.averageRating (detail) và ratingAverage (recommendation)
  const avgRating = r.stats?.averageRating ?? r.averageRating ?? r.ratingAverage ?? 5.0;
  const totalRev = r.stats?.totalReviews ?? r.reviewCount ?? 0;

  // Normalize cuisine types: hỗ trợ displayCuisineTypes (recommendation) và cuisineTypes (detail)
  const cuisineList: string[] =
    (r.displayCuisineTypes?.length ? r.displayCuisineTypes : null) ||
    (r.cuisineTypes?.length ? r.cuisineTypes : null) ||
    [];

  // Normalize giá: nếu có priceRangeMin/Max thì dùng format số, nếu không thì dùng nhãn priceRange/priceRangeLabel
  const renderPrice = () => {
    const hasNumericRange = r.priceRangeMin !== null && r.priceRangeMin !== undefined;
    if (hasNumericRange) {
      return formatPriceRange(r.priceRangeMin, r.priceRangeMax);
    }
    // Recommendation API trả về priceRangeLabel (tiếng Việt) hoặc priceRange (enum chữ)
    if (r.priceRangeLabel) return r.priceRangeLabel;
    if (r.priceRange) {
      const labels: Record<string, string> = {
        budget: 'Bình dân',
        moderate: 'Trung cấp',
        expensive: 'Cao cấp',
        luxury: 'Sang trọng',
        premium: 'Cao cấp',
        fine_dining: 'Fine Dining',
      };
      return labels[r.priceRange] || r.priceRange;
    }
    return 'Liên hệ';
  };

  // Normalize địa chỉ: hỗ trợ address object (detail), location object (recommendation), string
  const renderAddress = () => {
    if (r.address) {
      if (typeof r.address === 'object') {
        const addr = r.address as any;
        const parts = [addr.street, addr.district].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Địa chỉ';
      }
      return String(r.address);
    }
    if (r.location) {
      const parts = [r.location.district, r.location.city].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : '';
    }
    return '';
  };

  if (variant === 'featured') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.featuredCard, animatedStyle, style]}
      >
        <Image source={{ uri: imageUrl }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay} />
        <View style={styles.featuredContent}>
          <Text style={styles.featuredName} numberOfLines={1}>{restaurant.name}</Text>
          <View style={styles.featuredMeta}>
            <Text style={styles.featuredCuisine} numberOfLines={1}>
              {cuisineList.join(' · ') || 'Ẩm thực'}
            </Text>
            <Rating value={avgRating} style={styles.featuredRating} />
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  if (variant === 'compact') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.compactCard, animatedStyle, style]}
      >
        <Image source={{ uri: imageUrl }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>{restaurant.name}</Text>
          <Rating value={avgRating} />
        </View>
      </AnimatedPressable>
    );
  }

  // default: 'horizontal'
  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.horizontalCard, animatedStyle, style]}
    >
      <Image source={{ uri: imageUrl }} style={styles.horizontalImage} />
      <View style={styles.horizontalContent}>
        <View style={styles.horizontalHeader}>
          <Text style={styles.horizontalName} numberOfLines={1}>{restaurant.name}</Text>
          <Rating value={avgRating} count={totalRev} />
        </View>
        <Text style={styles.horizontalCuisine} numberOfLines={1}>
          {cuisineList.join(' · ') || 'Ẩm thực'}
        </Text>
        <Text style={styles.horizontalAddress} numberOfLines={1}>
          {renderAddress()}
        </Text>
        <Text style={styles.horizontalPrice}>
          {renderPrice()}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  // ─── Featured Variant ───
  featuredCard: {
    width: 260,
    height: 160,
    borderRadius: T.radius.lg,
    overflow: 'hidden',
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    ...shadows.card,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: T.space.md,
  },
  featuredName: {
    color: '#FFFFFF',
    fontFamily: T.font.display,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredCuisine: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    marginRight: T.space.sm,
  },
  featuredRating: {
    backgroundColor: 'rgba(12, 15, 22, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: T.radius.sm,
  },

  // ─── Compact Variant ───
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    padding: T.space.sm,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  compactImage: {
    width: 50,
    height: 50,
    borderRadius: T.radius.sm,
    marginRight: T.space.md,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  compactName: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  // ─── Horizontal Variant ───
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    marginBottom: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  horizontalImage: {
    width: 80,
    height: 80,
    borderRadius: T.radius.md,
    marginRight: T.space.md,
  },
  horizontalContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: T.space.sm,
  },
  horizontalName: {
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  horizontalCuisine: {
    color: T.color.text3,
    fontSize: 12,
    marginTop: 2,
  },
  horizontalAddress: {
    color: T.color.text3,
    fontSize: 12,
  },
  horizontalPrice: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
