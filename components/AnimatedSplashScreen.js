import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export default function AnimatedSplashScreen({ children }) {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const scaleValue = useRef(new Animated.Value(0.5)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide the native splash screen so the JS animated one becomes visible
    SplashScreen.hideAsync();

    // Start the entrance animation (scale up logo)
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    // 3. Wait 2 seconds, then fade out the whole custom splash screen
    const timeout = setTimeout(() => {
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsSplashVisible(false);
      });
    }, 2000); // Max 2 seconds loading time

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      {/* The main app content rendered underneath the splash screen */}
      {children}

      {/* The Custom Splash Screen overlaid on top */}
      {isSplashVisible && (
        <Animated.View style={[styles.splashContainer, { opacity: opacityValue }]}>
          <Animated.Image 
            source={require('../assets/splash.png')} 
            style={[styles.logo, { transform: [{ scale: scaleValue }] }]} 
            resizeMode="contain" 
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    backgroundColor: '#0B4F2E', // Green background color
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Ensure it sits on top of everything
  },
  logo: {
    width: 180,
    height: 180,
  }
});
