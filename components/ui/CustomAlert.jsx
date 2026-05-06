import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react-native';

const AlertContext = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' },
  error: { Icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' },
  warning: { Icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB' },
  info: { Icon: Info, color: '#3B82F6', bg: '#EFF6FF' },
  confirm: { Icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB' },
};

export function CustomAlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({});

  const show = useCallback((title, message, options = {}) => {
    setConfig({ title, message, type: options.type || 'info', buttons: options.buttons || [{ text: 'OK' }] });
    setVisible(true);
  }, []);

  const confirm = useCallback((title, message, onConfirm, options = {}) => {
    setConfig({
      title, message, type: options.type || 'confirm',
      buttons: [
        { text: options.cancelText || 'Cancel', style: 'cancel' },
        { text: options.confirmText || 'OK', onPress: onConfirm, style: options.destructive ? 'destructive' : 'default' },
      ],
    });
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const handlePress = useCallback((btn) => {
    setVisible(false);
    if (btn.onPress) setTimeout(() => btn.onPress(), 200);
  }, []);

  const { Icon, color, bg } = ICONS[config.type] || ICONS.info;

  return (
    <AlertContext.Provider value={{ show, confirm }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={s.overlay}>
          <View style={s.card}>
            {/* Icon */}
            <View style={[s.iconWrap, { backgroundColor: bg }]}>
              <Icon size={28} color={color} strokeWidth={2.5} />
            </View>

            {/* Title */}
            <Text style={s.title}>{config.title}</Text>

            {/* Message */}
            {config.message ? <Text style={s.message}>{config.message}</Text> : null}

            {/* Buttons */}
            <View style={s.btnRow}>
              {(config.buttons || []).map((btn, i) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handlePress(btn)}
                    activeOpacity={0.8}
                    style={[
                      s.btn,
                      isCancel && s.btnCancel,
                      isDestructive && s.btnDestructive,
                      !isCancel && !isDestructive && s.btnPrimary,
                      (config.buttons || []).length === 1 && { flex: 1 },
                    ]}
                  >
                    <Text style={[
                      s.btnText,
                      isCancel && s.btnTextCancel,
                      isDestructive && s.btnTextDestructive,
                    ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be inside CustomAlertProvider');
  return ctx;
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 30,
  },
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 28, width: '100%',
    maxWidth: 340, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  title: {
    fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3,
  },
  message: {
    fontSize: 14, fontWeight: '500', color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row', gap: 10, width: '100%',
  },
  btn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#134E3A',
  },
  btnCancel: {
    backgroundColor: '#F3F4F6',
  },
  btnDestructive: {
    backgroundColor: '#FEE2E2',
  },
  btnText: {
    fontSize: 14, fontWeight: '700', color: '#FFF',
  },
  btnTextCancel: {
    color: '#6B7280',
  },
  btnTextDestructive: {
    color: '#EF4444',
  },
});
