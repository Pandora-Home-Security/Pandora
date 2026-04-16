import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export function BrandHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.shieldWrap}>
        <Svg viewBox="0 0 48 48" width={52} height={52} fill="none">
          <Path
            d="M24 4L6 14V24C6 35.1 13.68 45.48 24 48C34.32 45.48 42 35.1 42 24V14L24 4Z"
            stroke={colors.accent}
            strokeWidth={2}
            opacity={0.3}
          />
          <Path
            d="M24 8L10 16V24C10 33.05 16.36 41.38 24 43.86C31.64 41.38 38 33.05 38 24V16L24 8Z"
            stroke={colors.accent}
            strokeWidth={1.5}
            opacity={0.6}
          />
          <Path
            d="M20 30L15 25L13.18 26.82L20 33.64L35 18.64L33.18 16.82L20 30Z"
            fill={colors.accent}
            opacity={0.9}
          />
        </Svg>
      </View>
      <Text style={styles.title}>Pandora</Text>
      <View style={styles.divider} />
      <Text style={styles.tagline}>Sustav kućne sigurnosti</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  shieldWrap: {
    marginBottom: 12,
  },
  title: {
    ...typography.brandTitle,
    color: colors.textPrimary,
  },
  divider: {
    width: 36,
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.7,
    borderRadius: 2,
    marginVertical: 10,
  },
  tagline: {
    ...typography.brandTagline,
    color: colors.textSecondary,
  },
});
