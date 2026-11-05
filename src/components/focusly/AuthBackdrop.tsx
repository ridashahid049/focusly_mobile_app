import React from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import type { MotiTransition } from 'moti';
import { colors } from '../../constants/colors';

function GlowCircle({
  size,
  top,
  left,
  right,
  bottom,
  opacity,
  delay,
}: {
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  opacity: number;
  delay: number;
}) {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReducedMotion
    );
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  const transition: MotiTransition = reducedMotion
    ? ({ type: 'timing', duration: 1 } as MotiTransition)
    : ({
        type: 'timing',
        duration: 4200,
        delay,
        loop: true,
        repeatReverse: true,
      } as MotiTransition);

  return (
    <MotiView
      pointerEvents="none"
      from={reducedMotion ? { opacity } : { opacity: opacity * 0.7, scale: 0.96 }}
      animate={reducedMotion ? { opacity } : { opacity, scale: 1.04 }}
      transition={transition}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          left,
          right,
          bottom,
          backgroundColor: `rgba(139, 92, 246, ${opacity})`,
        },
      ]}
    />
  );
}

export function AuthBackdrop() {
  return (
    <View style={styles.root} pointerEvents="none">
      <GlowCircle size={220} top={-40} left={-30} opacity={0.18} delay={0} />
      <GlowCircle size={180} top={120} right={-40} opacity={0.12} delay={500} />
      <GlowCircle size={140} bottom={120} left={40} opacity={0.1} delay={900} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
  },
});
