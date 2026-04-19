import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  description?: string;
  milestone?: string;
};

export function PlaceholderScreen({ title, description, milestone }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>
          {description ?? 'Ova stranica je u izradi. Bit će dostupna u sljedećim verzijama.'}
        </Text>
        {milestone && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{milestone}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.bgDeep,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    maxWidth: 360,
  },
  title: {
    ...typography.brandTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...typography.formSubheader,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  badge: {
    marginTop: 8,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  badgeText: {
    ...typography.label,
    color: colors.accent,
  },
});
