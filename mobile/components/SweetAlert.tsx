import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';

export default function SweetAlert() {
  const { currentAlert, alert: notify } = useNotification();
  const { theme, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const { title, message, type, visible, onConfirm, onCancel, confirmText, cancelText } = currentAlert;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
      });
    }
  }, [visible, scaleAnim, opacityAnim, mounted]);

  if (!mounted) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return theme.success;
      case 'error': return theme.error;
      case 'warning': return theme.warning;
      case 'info': return theme.info;
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
    notify('', '', 'info', 0);
  };

  const handleCancel = () => {
    onCancel?.();
    notify('', '', 'info', 0);
  };

  const isConfirm = !!onConfirm;

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? theme.surfaceElevated : theme.surface,
            borderColor: theme.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {isConfirm ? null : (
          <View style={[styles.iconCircle, { backgroundColor: getColor() + '20' }]}>
            <Ionicons name={getIcon() as any} size={40} color={getColor()} />
          </View>
        )}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {message ? <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text> : null}
        {isConfirm && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border, backgroundColor: isDark ? theme.surfaceElevated : theme.surface }]}
              onPress={handleCancel}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: theme.navy }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 9999,
    elevation: 10,
  },
  container: {
    width: Dimensions.get('window').width * 0.8,
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
