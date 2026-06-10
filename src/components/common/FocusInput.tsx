import React, {useState} from 'react';
import {Text, TextInput, TextInputProps, View} from 'react-native';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

/**
 * TextInput that highlights its border blue on focus and shows
 * an optional error message below. Drop-in replacement for the
 * cheatsheet text input pattern.
 */
export default function FocusInput({label, error, style, ...rest}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-4">
      {!!label && (
        <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{label}</Text>
      )}
      <TextInput
        className="bg-white rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
        style={[
          {borderWidth: 1.5, borderColor: error ? '#EF4444' : focused ? '#192433' : '#E5E7EB'},
          style,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor="#9CA3AF"
        {...rest}
      />
      {!!error && (
        <Text className="text-[#EF4444] text-xs mt-1 ps-1">{error}</Text>
      )}
    </View>
  );
}
