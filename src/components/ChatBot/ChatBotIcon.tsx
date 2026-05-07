import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  Image,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface ChatBotIconProps {
  onPress?: () => void;
  position?: 'bottom-right' | 'bottom-left';
  visible?: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const SHEET_OFFSET = 300;

const BUBBLE_MESSAGES = [
  "Hi, I'm your AI Assistant",
  "Need help? Chat with us!",
  "Ask me anything",
  "How can I assist you?",
  "Let's chat!",
];

export default function ChatBotIcon({ onPress, position = 'bottom-right', visible = true }: ChatBotIconProps) {
  const [chatVisible, setChatVisible] = useState(false);
  const [bubbleMessageIndex, setBubbleMessageIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hello! How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const headNodAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(0);

  // Vertical Floating Animation
  useEffect(() => {
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: -8,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    );

    floatingAnimation.start();

    return () => {
      floatingAnimation.stop();
    };
  }, [floatingAnim]);

  // Head Nodding Animation
  useEffect(() => {
    const nodAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(headNodAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(headNodAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    );

    nodAnimation.start();

    return () => {
      nodAnimation.stop();
    };
  }, [headNodAnim]);

  // Glow/Shine Animation (thinking indicator)
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    );

    glowAnimation.start();

    return () => {
      glowAnimation.stop();
    };
  }, [glowAnim]);

  // Rotate bubble message every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbleMessageIndex(prev => (prev + 1) % BUBBLE_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const bounceAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openChat = () => {
    setChatVisible(true);
    bounceAnimation();
    onPress?.();
  };

  const closeChat = () => {
    setChatVisible(false);
  };

  useEffect(() => {
    if (chatVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [chatVisible, slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => scrollY.current === 0,
      onMoveShouldSetPanResponder: (_, g) => {
        if (scrollY.current > 0) return false;
        return g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx);
      },
      onPanResponderMove: (_, g) => {
        if (scrollY.current === 0 && g.dy > 0) {
          slideAnim.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (scrollY.current === 0 && g.dy > 100) {
          closeChat();
          return;
        }
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 60,
        }).start();
      },
    })
  ).current;

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponses = [
        'Thanks for your message! Our support team will assist you shortly.',
        'I\'m here to help! Can you provide more details?',
        'Great question! Let me find that information for you.',
        'I understand. How else can I help you?',
        'Feel free to browse our product categories while we connect you with an agent.',
      ];

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        text: randomResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 800);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === 'user' ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {item.type === 'bot' && (
        <Image
          source={require('../../../assets/sir.png')}
          style={styles.botAvatarImage}
          resizeMode="contain"
        />
      )}
      <View
        style={[
          styles.messageBubble,
          item.type === 'user' ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.type === 'user' ? styles.userMessageText : styles.botMessageText,
          ]}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.chatBotContainer}>
      {/* Floating Message Bubble */}
      {!chatVisible && (
        <View
          style={[
            styles.messageBubbleContainer,
            {
              [position === 'bottom-right' ? 'right' : 'left']: 16,
            },
          ]}
        >
          <View style={styles.floatingMessageBubble}>
            <Text style={styles.messageBubbleText}>
              {BUBBLE_MESSAGES[bubbleMessageIndex]}
            </Text>
          </View>
          <View
            style={[
              styles.bubblePointer,
              position === 'bottom-right' ? styles.bubblePointerRight : styles.bubblePointerLeft,
            ]}
          />
        </View>
      )}

      {/* Floating Chat Button with Animations */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [
              { rotate: headNodAnim.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: ['0deg', '-13deg', '12deg', '-10deg', '0deg'],
              })},
            ],
            [position === 'bottom-right' ? 'right' : 'left']: 16,
          },
        ]}
      >

        <TouchableOpacity
          style={styles.chatButton}
          onPress={openChat}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../../assets/sir.png')}
            style={styles.chatButtonImage}
            resizeMode="contain"
          />
          {messages.length > 1 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{messages.length - 1}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        transparent
        animationType="none"
        onRequestClose={closeChat}
      >
        <Pressable style={styles.modalOverlay} onPress={closeChat}>
          <Animated.View style={[styles.chatModalContainer, { transform: [{ translateY: slideAnim }] }]} {...panResponder.panHandlers}>
            {/* Chat Header */}
            <View style={styles.sheetHandleArea}>
              <View style={styles.sheetHandle} />
            </View>
            <View style={styles.chatHeader}>
              <View style={styles.headerContent}>
                <Image
                  source={require('../../../assets/sir.png')}
                  style={styles.headerImage}
                  resizeMode="contain"
                />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.chatTitle}>AF Home Shop AI</Text>
                  <Text style={styles.onlineStatus}>Online • Always here to help</Text>
                </View>
              </View>
            </View>

            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesListContent}
              scrollEnabled={true}
              onScroll={(event) => { scrollY.current = event.nativeEvent.contentOffset.y; }}
              scrollEventThrottle={16}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            )}

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type your message..."
                placeholderTextColor={Colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                editable={!isLoading}
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={(!inputText.trim() || isLoading) ? Colors.textSecondary : Colors.white}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chatBotContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    pointerEvents: 'box-none',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    zIndex: 999,
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.sky,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonImage: {
    width: 56,
    height: 56,
  },
  aiGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.sky,
    zIndex: -1,
  },
  messageBubbleContainer: {
    position: 'absolute',
    bottom: 90,
    zIndex: 998,
    flexDirection: 'column',
    paddingHorizontal: 16,
  },
  floatingMessageBubble: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: 200,
    borderWidth: 2,
    borderColor: Colors.sky,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'visible',
  },
  messageBubbleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  messageBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bubblePointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.sky,
    marginTop: -2,
  },
  bubblePointerLeft: {
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginTop: -1,
  },
  bubblePointerRight: {
    alignSelf: 'flex-end',
    marginRight: 24,
    marginTop: -1,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  chatModalContainer: {
    height: '85%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  sheetHandleArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 2,
    backgroundColor: Colors.white,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  chatHeader: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  onlineStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: Colors.sky,
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.white,
    fontWeight: '500',
  },
  botMessageText: {
    color: Colors.text,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sky,
  },
  dot1: {
    opacity: 1,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: Colors.white,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sky,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});

