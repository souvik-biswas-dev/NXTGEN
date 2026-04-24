import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'success' | 'error' | 'info' | 'warning';

interface Action {
  label: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AppDialogProps {
  visible: boolean;
  variant?: Variant;
  title: string;
  message?: string;
  actions?: Action[];
  onDismiss?: () => void;
}

const variantMeta: Record<Variant, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  success: { icon: 'checkmark-circle', tint: '#10B981' },
  error: { icon: 'alert-circle', tint: '#EF4444' },
  info: { icon: 'information-circle', tint: '#3B82F6' },
  warning: { icon: 'warning', tint: '#F59E0B' },
};

export function AppDialog({
  visible,
  variant = 'info',
  title,
  message,
  actions,
  onDismiss,
}: AppDialogProps) {
  const { colors, dark } = useTheme();
  const { icon, tint } = variantMeta[variant];
  const resolvedActions: Action[] =
    actions && actions.length > 0 ? actions : [{ label: 'OK', onPress: onDismiss }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          flex: 1,
          backgroundColor: 'rgba(8, 15, 25, 0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingTop: 22,
            paddingBottom: 8,
            paddingHorizontal: 22,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: dark ? 0.5 : 0.2,
            shadowRadius: 24,
            elevation: 12,
            borderWidth: dark ? 1 : 0,
            borderColor: colors.outlineVariant,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: tint + '1F',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 14,
            }}
          >
            <Ionicons name={icon} size={30} color={tint} />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.secondary,
              textAlign: 'center',
              marginBottom: message ? 8 : 18,
            }}
          >
            {title}
          </Text>

          {message && (
            <Text
              style={{
                fontSize: 14,
                lineHeight: 20,
                color: colors.outline,
                textAlign: 'center',
                marginBottom: 18,
              }}
            >
              {message}
            </Text>
          )}

          <View
            style={{
              flexDirection: resolvedActions.length > 2 ? 'column' : 'row',
              gap: 8,
              marginTop: 4,
              marginBottom: 8,
            }}
          >
            {resolvedActions.map((action, idx) => {
              const isDestructive = action.style === 'destructive';
              const isCancel = action.style === 'cancel';
              const isPrimary = !isCancel && !isDestructive;

              const bg = isPrimary
                ? colors.primary
                : isDestructive
                  ? colors.error
                  : colors.surfaceVariant;
              const fg = isPrimary || isDestructive ? '#fff' : colors.secondary;

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.85}
                  onPress={() => {
                    action.onPress?.();
                    onDismiss?.();
                  }}
                  style={{
                    flex: resolvedActions.length > 2 ? undefined : 1,
                    backgroundColor: bg,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
