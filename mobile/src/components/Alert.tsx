import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  variant: 'error' | 'success';
  message: string;
};

export function Alert({ variant, message }: Props) {
  const isError = variant === 'error';

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: isError ? colors.errorBg : colors.successBg,
          borderColor: isError ? colors.errorBorder : colors.successBorder,
        },
      ]}
    >
      <Svg
        viewBox="0 0 20 20"
        width={18}
        height={18}
        fill={isError ? colors.error : colors.success}
      >
        {isError ? (
          <Path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        ) : (
          <Path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        )}
      </Svg>
      <Text
        style={[
          styles.text,
          { color: isError ? colors.errorText : colors.successText },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  text: {
    ...typography.alert,
    flex: 1,
  },
});
