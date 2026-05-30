import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import { haptics } from '../lib/haptics';
import type { SensorType } from '../data/mockData';

export type SensorFormData = {
  name: string;
  type: SensorType;
  location: string;
  status?: 'active' | 'inactive';
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: SensorFormData) => Promise<void>;
  initialData?: SensorFormData | null;
  isEdit?: boolean;
};

const typeOptions: { value: SensorType; label: string }[] = [
  { value: 'door', label: 'Vrata' },
  { value: 'window', label: 'Prozor' },
  { value: 'smoke', label: 'Dim' },
  { value: 'temperature', label: 'Temperatura' },
  { value: 'motion', label: 'Pokret' },
];

const statusOptions: { value: 'active' | 'inactive'; label: string }[] = [
  { value: 'active', label: 'Aktivan' },
  { value: 'inactive', label: 'Neaktivan' },
];

export function SensorFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isEdit,
}: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SensorType>('door');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setLocation(initialData.location);
      setStatus(initialData.status ?? 'active');
    } else {
      setName('');
      setType('door');
      setLocation('');
      setStatus('active');
    }
    setError('');
  }, [visible, initialData]);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) {
      setError('Naziv senzora je obavezan.');
      return;
    }
    if (!location.trim()) {
      setError('Lokacija je obavezna.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        location: location.trim(),
        ...(isEdit ? { status } : {}),
      });
      void haptics.success();
    } catch (err) {
      void haptics.error();
      setError(err instanceof Error ? err.message : 'Došlo je do greške.');
    } finally {
      setIsSubmitting(false);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.center}
          pointerEvents="box-none"
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isEdit ? 'Uredi senzor' : 'Dodaj novi senzor'}
              </Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Svg viewBox="0 0 20 20" width={20} height={20} fill={colors.textSecondary}>
                  <Path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </Svg>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Naziv senzora *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="npr. Senzor ulaznih vrata"
                  placeholderTextColor={colors.textMuted}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Tip *</Text>
                <View style={styles.chipRow}>
                  {typeOptions.map((opt) => {
                    const active = type === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setType(opt.value)}
                        disabled={isSubmitting}
                        style={({ pressed }) => [
                          styles.chip,
                          active && styles.chipActive,
                          pressed && !active && styles.chipPressed,
                        ]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Lokacija *</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="npr. Ulaz, Kuhinja, 1. kat"
                  placeholderTextColor={colors.textMuted}
                  editable={!isSubmitting}
                />
              </View>

              {isEdit && (
                <View style={styles.field}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.chipRow}>
                    {statusOptions.map((opt) => {
                      const active = status === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => setStatus(opt.value)}
                          disabled={isSubmitting}
                          style={({ pressed }) => [
                            styles.chip,
                            active && styles.chipActive,
                            pressed && !active && styles.chipPressed,
                          ]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnCancel,
                  pressed && styles.btnPressed,
                  isSubmitting && styles.btnDisabled,
                ]}
              >
                <Text style={styles.btnCancelText}>Odustani</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnSubmit,
                  pressed && styles.btnPressed,
                  isSubmitting && styles.btnDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.bgDeep} />
                ) : (
                  <Text style={styles.btnSubmitText}>
                    {isEdit ? 'Spremi promjene' : 'Dodaj senzor'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    maxHeight: '90%',
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
    borderRadius: 16,
  },
  form: {
    padding: 18,
    gap: 14,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radius.input,
    padding: 10,
  },
  errorText: {
    ...typography.alert,
    color: colors.errorText,
  },
  field: { gap: 6 },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.input,
    color: colors.textPrimary,
    ...typography.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgInput,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipPressed: {
    backgroundColor: colors.bgSurface,
  },
  chipText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.bgDeep,
    fontWeight: '700',
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
  btnCancel: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  btnSubmit: {
    backgroundColor: colors.accent,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
  btnCancelText: {
    ...typography.button,
    color: colors.textPrimary,
    fontSize: 14,
  },
  btnSubmitText: {
    ...typography.button,
    color: colors.bgDeep,
  },
});
