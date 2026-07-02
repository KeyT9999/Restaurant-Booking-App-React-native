import React from 'react';
import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import { T } from '@/src/theme/tokens';
import { Avatar } from '@/src/components/ui/Avatar';
import { FontAwesome } from '@expo/vector-icons';
import { formatDate } from '@/src/utils/format';

export interface Review {
  id: string;
  userId: {
    fullName: string;
    avatarUrl: string | null;
  } | null;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const userName = review.userId?.fullName || 'Thực khách';
  const avatarUrl = review.userId?.avatarUrl;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar name={userName} imageUri={avatarUrl} size={36} />
        <View style={styles.meta}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.stars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <FontAwesome
              key={i}
              name="star"
              size={12}
              color={i < review.rating ? T.color.primary : '#3A4255'}
              style={styles.star}
            />
          ))}
        </View>
      </View>

      <Text style={styles.comment}>{review.comment}</Text>

      {review.images && review.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {review.images.map((img, index) => (
            <Image key={index} source={{ uri: img }} style={styles.reviewImage} resizeMode="cover" />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.base,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.space.sm,
  },
  meta: {
    marginLeft: T.space.md,
    flex: 1,
  },
  userName: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    marginLeft: 2,
  },
  comment: {
    color: T.color.text2,
    fontSize: 13,
    lineHeight: 18,
    marginTop: T.space.xs,
  },
  imageScroll: {
    marginTop: T.space.md,
    flexDirection: 'row',
  },
  reviewImage: {
    width: 60,
    height: 60,
    borderRadius: T.radius.sm,
    marginRight: T.space.sm,
  },
});
export default ReviewCard;
