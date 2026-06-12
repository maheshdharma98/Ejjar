import React, {useState} from 'react';
import {Text, TextInput, TextInputProps, View} from 'react-native';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export default function FocusInput({label, error, style, ...rest}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{marginBottom: 14}}>
      {!!label && (
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 6,
            paddingStart: 4,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          {
            backgroundColor: focused ? '#FFFAF7' : '#F8FAFC',
            borderRadius: 12,
            height: 48,
            paddingHorizontal: 14,
            fontSize: 14,
            color: '#0F172A',
            borderWidth: 1.5,
            borderColor: error ? '#EF4444' : focused ? '#E67E3A' : '#E2E8F0',
          },
          style,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor="#bbb"
        {...rest}
      />
      {!!error && (
        <Text style={{color: '#EF4444', fontSize: 11, marginTop: 4, paddingStart: 4}}>
          {error}
        </Text>
      )}
    </View>
  );
}
