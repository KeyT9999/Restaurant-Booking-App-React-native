import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ViewStyle, TextStyle } from 'react-native';
import { T } from '@/src/theme/tokens';

interface TextFieldProps {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: React.ComponentType<{ size: number; color: string }>;
  suffix?: React.ReactNode;
  defaultValue?: string;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  icon: Icon,
  suffix,
  defaultValue,
  style,
  multiline = false,
  numberOfLines,
}) => {
  const [focused, setFocused] = useState(false);

  const borderRingColor = error
    ? 'rgba(244, 63, 94, 0.4)'
    : focused
    ? 'rgba(212, 150, 83, 0.5)'
    : 'rgba(255, 255, 255, 0.07)';

  const iconColor = focused ? T.color.primary : T.color.text3;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          { borderColor: borderRingColor },
          multiline && {
            height: undefined,
            minHeight: 80,
            paddingVertical: T.space.sm,
            alignItems: 'flex-start',
          },
        ]}
      >
        {Icon && (
          <View style={[styles.iconWrapper, multiline && { marginTop: 2 }]}>
            <Icon size={16} color={iconColor} />
          </View>
        )}
        <TextInput
          style={[styles.input, multiline && { textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={T.color.placeholder}
          value={value}
          onChangeText={onChangeText}
          defaultValue={defaultValue}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        {suffix && <View style={styles.suffixWrapper}>{suffix}</View>}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: T.color.text2,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: T.space.xs,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderWidth: 1,
    height: 48,
    borderRadius: T.radius.md,
    paddingHorizontal: T.space.base,
  },
  iconWrapper: {
    marginRight: T.space.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: T.color.text1,
    fontSize: 15,
    paddingVertical: 0, // fix vertical offset on Android
  },
  suffixWrapper: {
    marginLeft: T.space.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: T.color.error,
    fontSize: 12,
    marginTop: T.space.xs,
    fontWeight: '400',
  },
});
