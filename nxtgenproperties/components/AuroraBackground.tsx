import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

// Soft, slowly-drifting colour blobs that sit behind the hero gradient to give
// it life without any GL/native dependency. Parent must clip (overflow:hidden).
// Animates transforms (translate/scale) rather than layout props so it stays on
// the UI thread and buttery.
type Blob = {
  color: string;
  size: number;
  from: { top: number; left: number };
  to: { top: number; left: number };
  duration: number;
};

export function AuroraBackground({ blobs, opacity = 0.5 }: { blobs: Blob[]; opacity?: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {blobs.map((b, i) => (
        <MotiView
          key={i}
          from={{ translateX: 0, translateY: 0, scale: 1 }}
          animate={{
            translateX: b.to.left - b.from.left,
            translateY: b.to.top - b.from.top,
            scale: 1.25,
          }}
          transition={{
            loop: true,
            repeatReverse: true,
            type: 'timing',
            duration: b.duration,
            delay: i * 400,
          }}
          style={{
            position: 'absolute',
            top: b.from.top,
            left: b.from.left,
            width: b.size,
            height: b.size,
            borderRadius: b.size / 2,
            backgroundColor: b.color,
            opacity,
          }}
        />
      ))}
    </View>
  );
}
