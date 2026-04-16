import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';

type IconName = 'mail' | 'user' | 'lock' | 'lock-confirm';

type Props = TextInputProps & {
  label: string;
  icon?: IconName;
  isPassword?: boolean;
};

export function Input({ label, icon, isPassword = false, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const iconColor = focused ? colors.accent : colors.textMuted;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputBox,
          focused && styles.inputBoxFocused,
        ]}
      >
        {icon && (
          <View style={styles.leftIcon}>
            <FieldIcon name={icon} color={iconColor} />
          </View>
        )}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...inputProps}
        />
        {isPassword && (
          <Pressable
            style={styles.toggle}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={10}
            accessibilityLabel={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
          >
            <EyeIcon visible={showPassword} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function FieldIcon({ name, color }: { name: IconName; color: string }) {
  if (name === 'mail') {
    return (
      <Svg viewBox="0 0 20 20" width={18} height={18} fill={color}>
        <Path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
        <Path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
      </Svg>
    );
  }
  if (name === 'user') {
    return (
      <Svg viewBox="0 0 20 20" width={18} height={18} fill={color}>
        <Path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </Svg>
    );
  }
  // lock + lock-confirm — isti glyph
  return (
    <Svg viewBox="0 0 20 20" width={18} height={18} fill={color}>
      <Path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
        clipRule="evenodd"
      />
    </Svg>
  );
}

function EyeIcon({ visible, color }: { visible: boolean; color: string }) {
  if (visible) {
    return (
      <Svg viewBox="0 0 20 20" width={18} height={18} fill={color}>
        <Path
          fillRule="evenodd"
          d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z"
          clipRule="evenodd"
        />
        <Path d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0110 17a10.004 10.004 0 01-9.335-6.41 1.651 1.651 0 010-1.18A10.004 10.004 0 014.198 5.26l2.123 2.123A4 4 0 0010.748 13.93z" />
      </Svg>
    );
  }
  return (
    <Svg viewBox="0 0 20 20" width={18} height={18} fill={color}>
      <Path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <Path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    position: 'relative',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxFocused: {
    borderColor: colors.accent,
  },
  leftIcon: {
    paddingLeft: 14,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    ...typography.input,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
