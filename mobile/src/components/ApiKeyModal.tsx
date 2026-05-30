import { Modal, View, Text, Pressable, StyleSheet, Share } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { radius, type ColorPalette } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  visible: boolean;
  apiKey: string | null;
  onClose: () => void;
};

export function ApiKeyModal({ visible, apiKey, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const handleShare = async () => {
    if (!apiKey) return;
    try {
      await Share.share({ message: apiKey });
    } catch {
      // ignoriraj
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Senzor uspješno dodan</Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Svg viewBox="0 0 20 20" width={20} height={20} fill={colors.textSecondary}>
                  <Path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </Svg>
              </Pressable>
            </View>

            <View style={styles.body}>
              <Text style={styles.notice}>
                Spremite ovaj API ključ — prikazuje se samo jednom. Uređaj ga koristi za slanje događaja preko {`\n`}
                <Text style={styles.mono}>Authorization: Bearer API_KEY</Text>.
              </Text>

              <View style={styles.keyBox}>
                <Text style={styles.keyText} selectable>
                  {apiKey ?? ''}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnPrimaryText}>Podijeli / Kopiraj</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnCancelText}>Zatvori</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlayMedium },
    center: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
    card: {
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    title: {
      ...typography.formHeader,
      color: colors.textPrimary,
      fontSize: 16,
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      padding: 18,
      gap: 12,
    },
    notice: {
      ...typography.formSubheader,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    mono: {
      fontFamily: 'monospace',
      color: colors.accent,
      fontSize: 12,
    },
    keyBox: {
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.accentGlow,
      borderRadius: radius.input,
      padding: 12,
    },
    keyText: {
      fontFamily: 'monospace',
      color: colors.accent,
      fontSize: 12,
      lineHeight: 18,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      padding: 18,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPrimary: { backgroundColor: colors.accent },
    btnCancel: {
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    btnPressed: { opacity: 0.85 },
    btnPrimaryText: {
      ...typography.button,
      color: colors.bgDeep,
    },
    btnCancelText: {
      ...typography.button,
      color: colors.textPrimary,
      fontSize: 14,
    },
  });
