import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';

export interface SkeletonProps {
  /**
   * Width of the skeleton
   */
  width?: number | string;
  /**
   * Height of the skeleton
   */
  height?: number | string;
  /**
   * Border radius of the skeleton
   */
  borderRadius?: number;
  /**
   * Custom style for the skeleton
   */
  style?: ViewStyle;
  /**
   * Whether to show a circular skeleton (overrides borderRadius)
   */
  circle?: boolean;
}

/**
 * Reusable Skeleton component for loading states
 * Provides a shimmer animation effect
 */
export default function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  circle = false,
}: SkeletonProps) {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyle: ViewStyle = {
    width,
    height,
    borderRadius: circle ? (typeof height === 'number' ? height / 2 : 50) : borderRadius,
    backgroundColor: colors.neutral.gray.lighter,
    overflow: 'hidden',
  };

  return (
    <View style={[skeletonStyle, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.neutral.gray.lightest,
            opacity,
          },
        ]}
      />
    </View>
  );
}

/**
 * Skeleton Card component for card-like loading states
 */
export function SkeletonCard({
  width = '100%',
  height = 150,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.cardContainer, { width, height }, style]}>
      <Skeleton width="60%" height={20} borderRadius={8} style={styles.cardTop} />
      <Skeleton width="80%" height={32} borderRadius={8} style={styles.cardMiddle} />
      <View style={styles.cardBottom}>
        <Skeleton width="50%" height={14} borderRadius={6} />
        <Skeleton width="40%" height={14} borderRadius={6} style={styles.cardBottomItem} />
      </View>
    </View>
  );
}

/**
 * Skeleton List Item component for list loading states
 */
export function SkeletonListItem({
  showAvatar = true,
  showSubtitle = true,
  style,
}: {
  showAvatar?: boolean;
  showSubtitle?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.listItemContainer, style]}>
      {showAvatar && <Skeleton width={50} height={50} circle style={styles.listItemAvatar} />}
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} borderRadius={6} style={styles.listItemTitle} />
        {showSubtitle && <Skeleton width="50%" height={14} borderRadius={6} style={styles.listItemSubtitle} />}
      </View>
    </View>
  );
}

/**
 * Skeleton Grid component for grid loading states
 */
export function SkeletonGrid({
  columns = 2,
  items = 4,
  itemHeight = 120,
}: {
  columns?: number;
  items?: number;
  itemHeight?: number;
}) {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard
          key={index}
          width={`${100 / columns - 2}%`}
          height={itemHeight}
          style={styles.gridItem}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTop: {
    marginBottom: 12,
  },
  cardMiddle: {
    marginBottom: 24,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardBottomItem: {
    marginTop: 8,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemAvatar: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    marginBottom: 8,
  },
  listItemSubtitle: {
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: 16,
  },
});

