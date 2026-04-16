import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, loading = false, disabled = false }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [styles.wrap, pressed && !isDisabled && styles.pressed]}
    >
      <LinearGradient
        colors={[colors.accent, colors.accentDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, isDisabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.bgDeep} />
        ) : (
          <View style={styles.content}>
            <Text style={styles.label}>{label}</Text>
            <Svg viewBox="0 0 20 20" width={18} height={18} fill={colors.bgDeep}>
              <Path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </Svg>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.button,
    overflow: 'hidden',
    marginTop: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  gradient: {
    minHeight: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...typography.button,
    color: colors.bgDeep,
  },
});
