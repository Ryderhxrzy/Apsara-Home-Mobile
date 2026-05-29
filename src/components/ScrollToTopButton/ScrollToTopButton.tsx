import React, { useState, useCallback } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface ScrollToTopButtonProps {
  isVisible: boolean;
  onPress: () => void;
  isDarkMode?: boolean;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  isVisible,
  onPress,
  isDarkMode = false
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, fadeAnim]);

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  if (!isVisible) return null;

  const bgColor = isDarkMode ? '#1e293b' : Colors.white;
  const shadowColor = isDarkMode ? '#000' : '#000';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          pointerEvents: isVisible ? 'auto' : 'none',
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: bgColor,
            shadowColor,
          },
        ]}
      >
        <Ionicons name="arrow-up" size={24} color={Colors.sky} />
      </Pressable>
    </Animated.View>
  );
};

export default ScrollToTopButton;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    zIndex: 999,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 6,
  },
});
