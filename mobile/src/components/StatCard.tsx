import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';

type Variant = 'cameras' | 'sensors' | 'alarms';

type Props = {
  variant: Variant;
  label: string;
  value: string;
};

const variantConfig: Record<Variant, { tag: string; color: string }> = {
  cameras: { tag: 'CAM', color: '#5fa8d3' },
  sensors: { tag: 'IOT', color: '#5acf7a' },
  alarms: { tag: 'ALR', color: '#e54d4d' },
};

export function StatCard({ variant, label, value }: Props) {
  const cfg = variantConfig[variant];

  return (
    <View style={styles.card}>
      <View style={[styles.icon, { borderColor: cfg.color }]}>
        <Text style={[styles.iconText, { color: cfg.color }]}>{cfg.tag}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
