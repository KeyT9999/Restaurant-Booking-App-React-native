import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ActionCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  badge?: number | string;
  onPress?: () => void;
  iconColor?: string;
  badgeBgColor?: string;
}

export const ActionCard = ({ 
  icon, 
  title, 
  subtitle, 
  badge, 
  onPress,
  iconColor = '#e8955d',
  badgeBgColor = '#e8955d'
}: ActionCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      
      <View style={styles.rightContent}>
        {badge !== undefined && badge !== null && badge !== 0 && badge !== '0' && (
          <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Feather name="chevron-right" size={20} color="#5C5C66" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16171D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E1F25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8A8A93',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chevron: {
    opacity: 0.5,
  }
});
