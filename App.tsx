import React, { useState, useEffect } from 'react';
import { View, LogBox, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
const OneSignal = require('react-native-onesignal').default;

// Suppress the "Text strings must be rendered within a <Text> component" error
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginScreen from './src/screen/LoginScreen';
import SignupScreen from './src/screen/SignupScreen';
import OtpScreen from './src/screen/OtpScreen';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screen/OnboardingScreen';
import { storageService, StoredUser } from './src/services/storageService';
import LoadingScreen from './src/screen/LoadingScreen';
import { useOneSignalTokenRegistration } from './src/hooks/useOneSignalTokenRegistration';

type AuthScreen = 'login' | 'signup' | 'otp';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  monthly_activation?: {
    current_month_pv: number;
    threshold_pv: number;
    remaining_pv: number;
  };
}

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [otpEmail, setOtpEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    try {
      if (OneSignal && typeof OneSignal.initialize === 'function') {
        OneSignal.initialize('b4c95a1a-c525-447d-80bb-2c8dc63f4531');
        console.log('[App] OneSignal initialized successfully');
        setOneSignalReady(true);
      } else {
        console.warn('[App] OneSignal not available or initialize is not a function', OneSignal);
      }
    } catch (error) {
      console.error('[App] Failed to initialize OneSignal:', error);
    }
  }, []);

  // Register OneSignal push token when authenticated AND OneSignal is ready
  useOneSignalTokenRegistration(oneSignalReady ? authToken : null, oneSignalReady ? (authUser?.id || null) : null);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  async function checkStoredAuth() {
    try {
      const [isAuth, onboarded] = await Promise.all([
        storageService.isAuthenticated(),
        storageService.hasOnboarded(),
      ]);
      setHasOnboarded(onboarded);
      if (isAuth) {
        const token = await storageService.getToken();
        const user = await storageService.getUser();
        if (token && user) {
          setAuthToken(token);
          setAuthUser(user);
          setAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOnboardingDone() {
    await storageService.setOnboarded();
    setHasOnboarded(true);
  }

  async function resetOnboarding() {
    await storageService.resetOnboarding();
    setHasOnboarded(false);
  }

  async function goAuthenticated(user?: AuthUser, token?: string) {
    setAuthenticated(true);
    setScreen('login');
    if (user) setAuthUser(user);
    if (token) setAuthToken(token);
    
    // Save authentication data to storage for persistence
    if (user && token) {
      try {
        await storageService.saveAuthData(token, user);
      } catch (error) {
        console.error('Error saving auth data:', error);
      }
    }
  }

  async function logout() {
    try {
      await storageService.clearAuthData();
      setAuthenticated(false);
      setAuthUser(null);
      setAuthToken(null);
      setScreen('login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }


  function renderAuth() {
    if (screen === 'signup') {
      return (
        <SignupScreen
          onGoToLogin={() => setScreen('login')}
          onContinueToOtp={(email, token) => {
            setOtpEmail(email);
            setVerificationToken(token);
            setScreen('otp');
          }}
        />
      );
    }

    if (screen === 'otp') {
      return (
        <OtpScreen
          email={otpEmail}
          verificationToken={verificationToken}
          onBackToSignup={() => setScreen('signup')}
          onSuccess={goAuthenticated}
        />
      );
    }

    return <LoginScreen onGoToSignup={() => setScreen('signup')} onAuthenticated={(user, token) => goAuthenticated(user, token)} onResetOnboarding={resetOnboarding} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {isLoading ? (
          <LoadingScreen />
        ) : !hasOnboarded ? (
          <OnboardingScreen onDone={handleOnboardingDone} />
        ) : authenticated ? (
          <AppNavigator user={authUser} token={authToken} onLogout={logout} />
        ) : (
          renderAuth()
        )}
        <Toast />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}


