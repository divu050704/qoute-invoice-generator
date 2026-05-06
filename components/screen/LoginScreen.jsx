import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, ArrowRight } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { clearCachedUserId, preloadUserData } from '../utils/customSecureStore';
import { clearDemoDataOnce } from '../utils/seedDemoData';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../src/constants/colors';

const SECONDARY = '#0B4F2E';

export default function LoginScreen({ navigation, route }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // This screen might be called to re-login, or as initial
  const onLoginSuccess = route?.params?.onLoginSuccess;

  const handleLogin = async () => {
    if (phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Clean phone number and build user ID
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      const userId = 'user_' + cleanNumber;
      
      // Clear any cached ID from a previous session
      clearCachedUserId();
      
      // Save it locally as the master user ID
      await SecureStore.setItemAsync('app_user_id', userId);
      
      // Preload ALL user data from Firestore into memory (while spinner shows)
      await preloadUserData();

      // Seed 3 default companies on first install (runs only once via appInitV1 flag)
      clearDemoDataOnce();

      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigation.replace('MainTabs');
      }
      
    } catch (err) {
      setIsLoading(false);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={SECONDARY} />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topSection}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to QuotePG</Text>
          <Text style={styles.subtitle}>Enter your phone number to access your workspace and cloud data.</Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={[styles.inputContainer, error ? styles.inputError : null]}>
            <View style={styles.prefixContainer}>
              <Phone size={20} color={PRIMARY} strokeWidth={2.5} />
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text.replace(/[^0-9]/g, ''));
                if (error) setError('');
              }}
            />
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue Securely</Text>
                <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            By continuing, your data will be securely synced to the cloud. No OTP required for quick access.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SECONDARY,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    borderRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    opacity: 0.9,
  },
  bottomSection: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    height: 60,
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRightWidth: 1.5,
    borderRightColor: '#E2E8F0',
    height: '100%',
    gap: 8,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 16,
    marginLeft: 4,
    marginTop: -8,
  },
  button: {
    backgroundColor: PRIMARY,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
    paddingHorizontal: 10,
  }
});
