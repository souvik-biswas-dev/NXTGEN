import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Brand palette (see constants/theme.ts)
const TEAL_LIGHT = '#13938A';
const TEAL = '#0F766E';
const TEAL_DEEP = '#0C3F45';
const GOLD = '#D4A24C';

/**
 * Full-screen branded loading screen shown while the app boots (auth check).
 * Picks up seamlessly from the native splash (same teal background + logo).
 */
export default function BrandedSplash() {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fade, rise, scale, pulse]);

  const logoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });

  return (
    <LinearGradient
      colors={[TEAL_LIGHT, TEAL, TEAL_DEEP]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: rise }, { scale }],
          alignItems: 'center',
        }}
      >
        <View style={styles.logoWrap}>
          <Animated.View
            style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
          <Animated.Image
            source={require('../assets/brand-mark.png')}
            style={[styles.logo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brand}>NXTGEN</Text>
        <Text style={styles.sub}>PROPERTIES</Text>
      </Animated.View>

      <Animated.View style={[styles.loader, { opacity: fade }]}>
        <ActivityIndicator color="#FFFFFF" />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
  },
  logo: { width: 132, height: 132, borderRadius: 30 },
  brand: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: 6 },
  sub: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 10,
    marginTop: 6,
    marginLeft: 10, // offset trailing letter-spacing so it reads centered
  },
  loader: { position: 'absolute', bottom: 76 },
});
