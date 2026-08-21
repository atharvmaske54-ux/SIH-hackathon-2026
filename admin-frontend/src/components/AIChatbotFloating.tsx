import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAppContext } from '../context/AppContext';

export type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  title?: string;
  text: string;
  timestamp: string;
  actions?: Array<{ label: string; action: string }>;
};

const API_BASE_URL = 'http://localhost:5000/api/v1';

export default function AIChatbotFloating() {
  const router = useRouter();
  const { user, reports } = useAppContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMsg, setInputMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      title: '🤖 SafeRoute AI Safety Assistant',
      text: `Hello! I am your 24/7 AI Safety Companion. Ask me about real-time area risk, emergency SOS procedures, anonymous reporting, or safe route recommendations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: 'Is my location safe?', action: 'check_risk' },
        { label: 'How to trigger SOS?', action: 'sos_info' },
        { label: 'Anonymous Reporting', action: 'report_info' },
        { label: 'Legal Rights ⚖️', action: 'legal_info' },
      ],
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for floating AI icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/risk/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          title: data.title || '🤖 SafeRoute AI Guard',
          text: data.reply || 'I am here to assist with your safety.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: data.actions || [],
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('API request error');
      }
    } catch (err) {
      // Local Intelligent AI Fallback
      let replyText = 'I am here to support your safety. You can trigger Emergency SOS from the main bar or file a report anytime.';
      let actions: Array<{ label: string; action: string }> = [
        { label: 'Trigger SOS', action: 'sos' },
        { label: 'Report Hazard', action: 'open_report' },
      ];

      const lower = text.toLowerCase();
      if (lower.includes('risk') || lower.includes('safe')) {
        replyText = `Based on live campus analytics (${reports.filter(r => r.status === 'Verified').length} verified reports), main corridors are monitored by security patrols. Use 'Safest Route' on Map mode after dark.`;
        actions = [{ label: 'View Safety Map', action: 'open_map' }];
      } else if (lower.includes('sos') || lower.includes('emergency') || lower.includes('help')) {
        replyText = `🚨 Emergency Protocols:\n1. Hold the Red SOS button on your screen bottom bar.\n2. Tap 'Fake Call' to deter unwanted followers.\n3. Women Helpline: Call 1091 | National Emergency: 112.`;
        actions = [{ label: 'Trigger SOS', action: 'sos' }, { label: 'Call 112', action: 'call_112' }];
      } else if (lower.includes('legal') || lower.includes('right')) {
        replyText = `⚖️ Key Legal Rights:\n• Zero FIR: File a complaint at any police station.\n• Privacy: Victims' identities are protected by law under BNS/IPC.\n• Free Legal Aid: Available 24/7.`;
        actions = [{ label: 'Call 1091 Helpline', action: 'call_1091' }];
      }

      const aiMsg: ChatMessage = {
        id: `ai-fallback-${Date.now()}`,
        sender: 'ai',
        title: '🤖 SafeRoute AI Guard',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions,
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (act: string) => {
    switch (act) {
      case 'sos':
      case 'sos_info':
        setIsOpen(false);
        router.push('/(tabs)/sos' as any);
        break;
      case 'fake_call':
        setIsOpen(false);
        router.push('/fake-call' as any);
        break;
      case 'open_report':
      case 'report_info':
        setIsOpen(false);
        router.push('/report-incident' as any);
        break;
      case 'track_report':
        setIsOpen(false);
        router.push('/report-incident' as any);
        break;
      case 'open_map':
      case 'check_risk':
        setIsOpen(false);
        router.push('/(tabs)/map' as any);
        break;
      case 'start_companion':
        setIsOpen(false);
        router.push('/check-in' as any);
        break;
      case 'call_112':
        Linking.openURL('tel:112');
        break;
      case 'call_1091':
        Linking.openURL('tel:1091');
        break;
      case 'legal_info':
        handleSend('Tell me about legal rights and emergency helplines');
        break;
      default:
        handleSend('Tell me more');
        break;
    }
  };

  return (
    <>
      {/* FLOATING BOT ICON - FIXED BOTTOM RIGHT */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setIsOpen(true)}
            activeOpacity={0.85}
          >
            {/* Custom 6-Petal Pinwheel Flower Logo matching user image */}
            <View style={styles.flowerIconWrapper}>
              {[0, 60, 120, 180, 240, 300].map((deg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.petalLeaf,
                    { transform: [{ rotate: `${deg}deg` }, { translateY: -6 }] }
                  ]}
                />
              ))}
              <View style={styles.flowerCenterDot} />
            </View>
            <View style={styles.onlineBadge} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* CHATBOT MODAL OVERLAY */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.chatWindow}>
            {/* Modal Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.headerFlowerIcon}>
                  {[0, 60, 120, 180, 240, 300].map((deg, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.petalLeafMini,
                        { transform: [{ rotate: `${deg}deg` }, { translateY: -4 }] }
                      ]}
                    />
                  ))}
                  <View style={styles.flowerCenterDotMini} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>SafeRoute AI Assistant</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={styles.headerOnlineDot} />
                    <Text style={styles.headerSubtitle}>24/7 Real-Time Safety AI Engine</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsOpen(false)}
              >
                <FontAwesome5 name="times" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Action Chips Bar */}
            <View style={styles.quickChipsBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <TouchableOpacity style={styles.chipBtn} onPress={() => handleSend('Is my area safe right now?')}>
                  <Text style={styles.chipText}>🛡️ Area Safety</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chipBtn} onPress={() => handleSend('How to trigger emergency SOS?')}>
                  <Text style={styles.chipText}>🚨 Emergency SOS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chipBtn} onPress={() => handleSend('How does anonymous reporting work?')}>
                  <Text style={styles.chipText}>📝 Anonymous Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chipBtn} onPress={() => handleSend('Legal rights and helpline numbers')}>
                  <Text style={styles.chipText}>⚖️ Legal Rights</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Messages Scroll Area */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesScroll}
              contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            >
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgWrapper,
                    msg.sender === 'user' ? styles.userMsgWrapper : styles.aiMsgWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.msgBubble,
                      msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    {msg.title && <Text style={styles.msgTitle}>{msg.title}</Text>}
                    <Text style={[styles.msgText, msg.sender === 'user' && styles.userMsgText]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.msgTime, msg.sender === 'user' && { color: '#93C5FD' }]}>
                      {msg.timestamp}
                    </Text>

                    {/* Action buttons embedded in message */}
                    {msg.actions && msg.actions.length > 0 && (
                      <View style={styles.actionsBox}>
                        {msg.actions.map((act, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.msgActionBtn}
                            onPress={() => handleActionClick(act.action)}
                          >
                            <Text style={styles.msgActionText}>{act.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {loading && (
                <View style={[styles.msgWrapper, styles.aiMsgWrapper]}>
                  <View style={[styles.msgBubble, styles.aiBubble, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Analyzing safety parameters...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about safety, routes, or emergency help..."
                placeholderTextColor={Colors.textSecondary}
                value={inputMsg}
                onChangeText={setInputMsg}
                onSubmitEditing={() => handleSend()}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputMsg.trim() && { backgroundColor: Colors.border }]}
                onPress={() => handleSend()}
                disabled={!inputMsg.trim()}
              >
                <FontAwesome5 name="paper-plane" size={14} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 75,
    right: 20,
    zIndex: 9999,
  },
  floatingButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  flowerIconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  petalLeaf: {
    position: 'absolute',
    width: 8,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#38BDF8',
  },
  flowerCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  chatWindow: {
    height: '75%',
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerFlowerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  petalLeafMini: {
    position: 'absolute',
    width: 6,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
  },
  flowerCenterDotMini: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  headerOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  closeBtn: {
    padding: 8,
  },
  quickChipsBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#1E293B',
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  chipText: {
    fontSize: 12,
    color: Colors.white,
  },
  messagesScroll: {
    flex: 1,
  },
  msgWrapper: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  userMsgWrapper: {
    alignSelf: 'flex-end',
  },
  aiMsgWrapper: {
    alignSelf: 'flex-start',
  },
  msgBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderBottomLeftRadius: 2,
  },
  msgTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  msgText: {
    fontSize: 13.5,
    color: Colors.white,
    lineHeight: 19,
  },
  userMsgText: {
    color: Colors.white,
  },
  msgTime: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  actionsBox: {
    marginTop: 8,
    gap: 6,
  },
  msgActionBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignSelf: 'flex-start',
  },
  msgActionText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#0F172A',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#1E293B',
    borderRadius: 21,
    paddingHorizontal: 16,
    color: Colors.white,
    fontSize: 13.5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
