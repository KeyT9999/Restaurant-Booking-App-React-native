import React from 'react';
import { StyleSheet, Text, View, Image, ViewStyle } from 'react-native';
import { T } from '@/src/theme/tokens';

interface AvatarProps {
  name: string;
  size?: number;
  imageUri?: string | null;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40, imageUri, style }) => {
  const initials = name ? name.charAt(0).toUpperCase() : '';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: T.radius.lg,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.42 }]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(212, 150, 83, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(212, 150, 83, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    color: T.color.primary,
    fontFamily: T.font.display,
    fontWeight: '700',
  },
});
