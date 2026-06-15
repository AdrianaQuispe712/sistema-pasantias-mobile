/**
 * ChatScreen - Conversación individual (rol Jefe de Pasantes)
 *
 * Muestra mensajes de una conversación con un pasante.
 * - Mensajes del jefe alineados a la derecha (azul)
 * - Mensajes del pasante alineados a la izquierda (gris)
 * - Input para enviar nuevos mensajes
 * - Auto-scroll al último mensaje
 * - Polling cada 5 segundos para nuevos mensajes
 * - Indicador de "escribiendo..."
 *
 * @module screens/jefe/ChatScreen
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { LoadingSpinner } from '../../components/ui';
import { getConversacion, sendMensaje, sendTyping, markConversationRead } from '../../api/jefeMensajeria';

/**
 * Formatea fecha ISO a hh:mm
 */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
};

/**
 * Formatea fecha ISO a dd/mm/yyyy
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

const ChatScreen = ({ route }) => {
  const { conversationId, pasanteName } = route.params;

  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [error, setError] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const lastMessageId = useRef(null);
  const typingTimeout = useRef(null);

  // ─── Keyboard listener ─────────────────────────────────────

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ─── Fetch messages ────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const data = await getConversacion(conversationId);
      const messages = data?.mensajesCollection || data?.mensajes || [];
      setMensajes(messages);

      // Track last message for auto-scroll
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const newLastId = lastMsg.idMensaje || lastMsg.id;
        if (lastMessageId.current && newLastId !== lastMessageId.current) {
          // New messages arrived
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
        lastMessageId.current = newLastId;
      }

      // Mark as read
      markConversationRead(conversationId).catch(() => {});
    } catch {
      setError('No se pudieron cargar los mensajes.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ─── Polling for new messages ──────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // ─── Send message ──────────────────────────────────────────

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      setInputText('');

      await sendMensaje({
        idPasante: route.params?.pasanteId,
        conversacion_id: conversationId,
        contenido: text,
        tipo: 'observacion',
      });

      // Refresh messages
      await fetchMessages();

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      setInputText(text); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  // ─── Typing indicator ─────────────────────────────────────

  const handleTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    sendTyping(conversationId).catch(() => {});
    typingTimeout.current = setTimeout(() => {
      sendTyping(conversationId, null).catch(() => {});
    }, 2000);
  }, [conversationId]);

  // ─── Render message ───────────────────────────────────────

  const renderMessage = ({ item }) => {
    const isJefe = item.sender_type === 'jefe';
    const contenido = item.contenido || '';
    const time = formatTime(item.created_at);

    return (
      <View style={[styles.messageBubble, isJefe ? styles.messageJefe : styles.messagePasante]}>
        {/* Reply-to indicator */}
        {item.reply_to && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyText} numberOfLines={1}>
              ↩ {item.reply_to.contenido}
            </Text>
          </View>
        )}

        <Text style={[styles.messageText, isJefe && styles.messageTextJefe]}>
          {contenido}
        </Text>
        <Text style={[styles.messageTime, isJefe && styles.messageTimeJefe]}>
          {time}
        </Text>
      </View>
    );
  };

  // ─── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner fullScreen message="Cargando mensajes..." />
      </View>
    );
  }

  // ─── Error ─────────────────────────────────────────────────

  if (error && mensajes.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMessages}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Main ──────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={mensajes}
        keyExtractor={(item) => String(item.idMensaje || item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Typing indicator */}
      {typingUser && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>{typingUser} está escribiendo...</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: keyboardHeight > 0 ? keyboardHeight : spacing.sm }]}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            handleTyping();
          }}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Ionicons
            name="send"
            size={20}
            color={(!inputText.trim() || sending) ? colors.textLight : colors.white}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  // Message bubbles
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  messageJefe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  messagePasante: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.xs,
    ...shadows.sm,
  },
  messageText: {
    fontSize: typography.md,
    color: colors.text,
    lineHeight: typography.md * typography.normal,
  },
  messageTextJefe: {
    color: colors.white,
  },
  messageTime: {
    fontSize: typography.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  messageTimeJefe: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Reply
  replyContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderLeftWidth: 2,
    borderLeftColor: colors.grayLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  replyText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // Typing
  typingContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  typingText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: typography.md,
    color: colors.text,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.grayBackground,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.white,
  },
});

export default ChatScreen;
