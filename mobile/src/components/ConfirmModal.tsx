import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Potvrdi',
  cancelText = 'Odustani',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.card}>
            {danger && (
              <View style={styles.iconWrap}>
                <Svg viewBox="0 0 20 20" width={28} height={28} fill={colors.error}>
                  <Path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </Svg>
              </View>
            )}

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.actions}>
              <Pressable
                onPress={onCancel}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnCancel,
                  pressed && styles.btnPressed,
                  isLoading && styles.btnDisabled,
                ]}
              >
                <Text style={styles.btnCancelText}>{cancelText}</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.btn,
                  danger ? styles.btnDanger : styles.btnPrimary,
                  pressed && styles.btnPressed,
                  isLoading && styles.btnDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={danger ? colors.textPrimary : colors.bgDeep} />
                ) : (
                  <Text style={danger ? styles.btnDangerText : styles.btnPrimaryText}>
                    {confirmText}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...typography.formHeader,
    color: colors.textPrimary,
    fontSize: 17,
    textAlign: 'center',
  },
  message: {
    ...typography.formSubheader,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnDanger: {
    backgroundColor: colors.error,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
  btnCancelText: {
    ...typography.button,
    color: colors.textPrimary,
    fontSize: 14,
  },
  btnPrimaryText: {
    ...typography.button,
    color: colors.bgDeep,
  },
  btnDangerText: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
