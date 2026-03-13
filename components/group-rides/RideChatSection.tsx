import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { listMessages, postMessage, RideMessage } from '@/repositories/groupRidesRepo';
import { useUserProfile } from '@/contexts/UserProfileContext';
import Colors from '@/constants/Colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RideChatSectionProps {
  groupRideId: string;
  isExpired: boolean;
}

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#0BBF76', '#4A9FE8', '#E86B4A', '#9B6BE8', '#E8B84A', '#4AE8D4'];
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function RideChatSection({ groupRideId, isExpired }: RideChatSectionProps) {
  const { userProfile, setUserName, hasName } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // ── Violent button animation ──────────────────────────────────
  // 1. Shake: rapid left-right rotation
  // 2. Scale pulse: grows and shrinks aggressively
  // 3. Glow ring: opacity pulses
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (isExpired || open) {
      cancelAnimation(rotate);
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      cancelAnimation(glowScale);
      rotate.value = 0;
      scale.value = 1;
      glowOpacity.value = 0.4;
      glowScale.value = 1;
      return;
    }

    // Shake: rotate ±18° rapidly, 3 shakes then pause, repeat
    rotate.value = withRepeat(
      withSequence(
        withTiming(18, { duration: 80, easing: Easing.linear }),
        withTiming(-18, { duration: 80, easing: Easing.linear }),
        withTiming(14, { duration: 70, easing: Easing.linear }),
        withTiming(-14, { duration: 70, easing: Easing.linear }),
        withTiming(8, { duration: 60, easing: Easing.linear }),
        withTiming(0, { duration: 60, easing: Easing.linear }),
        // pause before next shake
        withDelay(1800, withTiming(0, { duration: 1 }))
      ),
      -1,
      false
    );

    // Scale: pop out on each shake burst
    scale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0.92, { duration: 80 }),
        withTiming(1.1, { duration: 80 }),
        withTiming(1, { duration: 100 }),
        withDelay(1800, withTiming(1, { duration: 1 }))
      ),
      -1,
      false
    );

    // Glow ring: fast pulse in sync with shake, then slow breathe during pause
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 200 }),
        withTiming(0.2, { duration: 200 }),
        withTiming(0.8, { duration: 200 }),
        withTiming(0.15, { duration: 1600, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      false
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.7, { duration: 200 }),
        withTiming(1.2, { duration: 200 }),
        withTiming(1.6, { duration: 200 }),
        withTiming(1.1, { duration: 1600, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      false
    );
  }, [isExpired, open]);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  // ── Messages ──────────────────────────────────────────────────
  useEffect(() => {
    if (open && !isExpired) loadMessages();
  }, [open, groupRideId, isExpired]);

  const loadMessages = async () => {
    const data = await listMessages(groupRideId);
    setMessages(data);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 80);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!hasName) {
      setNameInput('');
      setShowNamePrompt(true);
    } else {
      send(userProfile?.name || '', trimmed);
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) return;
    try {
      await setUserName(trimmed);
      setShowNamePrompt(false);
      send(trimmed, input.trim());
    } catch (e) {
      console.error('Failed to save name:', e);
    }
  };

  const send = async (userName: string, text: string) => {
    setSending(true);
    try {
      await postMessage(groupRideId, userName, text);
      setInput('');
      await loadMessages();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: RideMessage; index: number }) => {
    const isOwn = item.userName === userProfile?.name;
    const prevItem = index > 0 ? messages[index - 1] : null;
    const showSender = !isOwn && item.userName !== prevItem?.userName;

    if (isOwn) {
      return (
        <View style={styles.ownRow}>
          <View style={styles.ownBubble}>
            <Text style={styles.ownText}>{item.message}</Text>
            <Text style={styles.ownTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      );
    }

    const avatarColor = nameToColor(item.userName);
    return (
      <View style={styles.otherRow}>
        {showSender ? (
          <View style={[styles.avatar, { backgroundColor: avatarColor + '22' }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>
              {getInitials(item.userName)}
            </Text>
          </View>
        ) : (
          <View style={styles.avatarSpacer} />
        )}
        <View style={styles.otherColumn}>
          {showSender && (
            <Text style={[styles.senderName, { color: avatarColor }]}>{item.userName}</Text>
          )}
          <View style={styles.otherBubble}>
            <Text style={styles.otherText}>{item.message}</Text>
            <Text style={styles.otherTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Expired: no button ────────────────────────────────────────
  if (isExpired) return null;

  return (
    <>
      {/* ── Floating button ── */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Glow ring behind button */}
        <Animated.View style={[styles.glowRing, glowAnimStyle]} />

        <Animated.View style={buttonAnimStyle}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setOpen(true)}
            activeOpacity={0.85}
          >
            <FontAwesome name="comments" size={24} color="#0A0A0B" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Full-screen chat modal ── */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            style={styles.modalSheet}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandleBar} />
              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleLeft}>
                  <View style={styles.modalTitleIcon}>
                    <FontAwesome name="comments" size={14} color={Colors.brandGreen} />
                  </View>
                  <Text style={styles.modalTitle}>Klepet</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setOpen(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <FontAwesome name="times" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <FontAwesome name="comments-o" size={36} color={Colors.border} />
                  <Text style={styles.emptyTitle}>Ni sporočil</Text>
                  <Text style={styles.emptySub}>Začni pogovor z udeleženci.</Text>
                </View>
              }
              renderItem={renderMessage}
            />

            {/* Input bar */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Napiši sporočilo..."
                placeholderTextColor={Colors.textSecondary}
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || sending}
                activeOpacity={0.75}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <FontAwesome name="send" size={15} color={Colors.background} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* ── Name prompt inside the chat modal ── */}
        {showNamePrompt && (
          <View style={styles.nameOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.nameOverlayInner}
            >
              <View style={styles.nameCard}>
                <View style={styles.nameIconCircle}>
                  <FontAwesome name="user" size={18} color={Colors.brandGreen} />
                </View>
                <Text style={styles.nameTitle}>Kako ti je ime?</Text>
                <Text style={styles.nameHelper}>
                  Tvoje ime bo vidno ostalim udeležencem v klepetu.
                </Text>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Ime in priimek"
                  placeholderTextColor={Colors.textSecondary}
                  autoFocus
                  autoCapitalize="words"
                />
                <View style={styles.nameBtns}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowNamePrompt(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Prekliči</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, nameInput.trim().length < 2 && styles.confirmBtnDisabled]}
                    onPress={handleSaveName}
                    disabled={nameInput.trim().length < 2}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.confirmBtnText}>Potrdi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── FAB ──
  fabContainer: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  glowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.brandGreen,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.brandGreen,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },

  // ── Modal sheet ──
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    height: SCREEN_HEIGHT * 0.92,
    backgroundColor: Colors.surface1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitleIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(11,191,118,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(11,191,118,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Messages ──
  messageListContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 4,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    opacity: 0.6,
    textAlign: 'center',
  },

  // own bubble
  ownRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  ownBubble: {
    maxWidth: '72%',
    backgroundColor: 'rgba(11,191,118,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(11,191,118,0.3)',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  ownText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  ownTime: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },

  // other bubble
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  avatarSpacer: {
    width: 30,
    marginRight: 8,
  },
  otherColumn: {
    maxWidth: '72%',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  otherBubble: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  otherText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  otherTime: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // ── Input bar ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
    backgroundColor: Colors.surface1,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.surface2,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brandGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },

  // ── Name prompt ──
  nameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  nameOverlayInner: {
    width: '100%',
    alignItems: 'center',
  },
  nameCard: {
    backgroundColor: Colors.surface1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  nameIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(11,191,118,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(11,191,118,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  nameTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  nameHelper: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  nameBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.brandGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.background,
  },
});
