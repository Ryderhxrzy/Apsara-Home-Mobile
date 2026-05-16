import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  SafeAreaView,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function IndexScreen({
  onGoToLogin,
  onGoToSignup,
}: {
  onGoToLogin?: () => void;
  onGoToSignup?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const player = useVideoPlayer(require('../../assets/login/afhome.mp4'), p => {
    p.loop = true;
    p.muted = true;
    p.rate = 1.0;
    p.play();
  });

  React.useEffect(() => {
    if (player) {
      player.play();
    }
  }, [player]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log('Google login pressed');
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(err =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.overlay} />
      <View style={styles.container}>
          {/* Spacer to push content to bottom */}
          <View style={styles.spacer} />

          {/* Bottom Gradient - extends to bottom navigation */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 1)']}
            locations={[0, 0.4, 1]}
            style={styles.gradient}
            pointerEvents="none"
          />

          {/* Bottom Content Section */}
          <SafeAreaView style={styles.contentSection} edges={['bottom']}>
            {/* Logo and Text Section */}
          <View style={styles.textWithLogoSection}>
              <View style={styles.headingSection}>
                <Text style={styles.heading}>Share. Earn. Enjoy</Text>
                <Text style={styles.subheading} numberOfLines={1}>
                  Start your affiliate journey today
                </Text>
              </View>
            </View>

          {/* Login Buttons */}
          <View style={styles.buttonSection}>
            <Pressable
              style={styles.loginButton}
              onPress={onGoToLogin}
              disabled={loading}
            >
              <Ionicons name="mail-outline" size={18} color={Colors.white} />
              <Text style={styles.loginButtonText}>Login with Email/Username</Text>
            </Pressable>

            <Pressable
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
          </View>

          {/* Signup Link */}
          <View style={styles.signupLinkSection}>
            <Text style={styles.signupText}>Don't have an account?{' '}</Text>
            <TouchableOpacity onPress={onGoToSignup}>
              <Text style={styles.signupLink}>Signup</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Text */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              By creating account and signing in you agree to our{' '}
              <Text
                style={styles.footerLink}
                onPress={() => handleOpenUrl('https://example.com/terms')}
              >
                terms & conditions
              </Text>
              {' '}and{' '}
              <Text
                style={styles.footerLink}
                onPress={() => handleOpenUrl('https://example.com/privacy')}
              >
                privacy policy
              </Text>
            </Text>
          </View>
        </SafeAreaView>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    zIndex: 1,
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
    zIndex: 2,
  },
  textWithLogoSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  sideLogoImage: {
    width: 48,
    height: 48,
    opacity: 0.6,
    marginBottom: -15,
    backgroundColor: 'transparent',
  },
  headingSection: {
    gap: 4,
    alignItems: 'flex-start',
    marginTop: -5,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.white,
    letterSpacing: 0.2,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '400',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    textAlign: 'left',
  },
  buttonSection: {
    gap: 12,
    marginTop: -16,
  },
  loginButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.sky,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  googleButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  signupLinkSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  signupText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    textDecorationLine: 'underline',
  },
  footerSection: {
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
});
