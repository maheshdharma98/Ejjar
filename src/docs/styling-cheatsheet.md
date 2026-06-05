# EJJAR Styling Cheatsheet — Uniwind + Tailwind

## Core Rules
1. NEVER use StyleSheet.create()
2. ALWAYS use className with Tailwind classes
3. Use ps/pe/ms/me instead of pl/pr/ml/mr (RTL safe)
4. Use hardcoded hex colors that match CLAUDE.md exactly

## Primary Button
<TouchableOpacity
  className="bg-[#1A4FBA] h-[52px] rounded-2xl
  items-center justify-center shadow-md mx-4"
  activeOpacity={0.8}
  onPress={fn}
>
  <Text className="text-white text-base font-semibold tracking-wide">
    {t('key')}
  </Text>
</TouchableOpacity>

## Outline Button
<TouchableOpacity
  className="border-2 border-[#1A4FBA] h-[48px] rounded-2xl
  items-center justify-center"
  activeOpacity={0.7}
  onPress={fn}
>
  <Text className="text-[#1A4FBA] text-base font-medium">
    {t('key')}
  </Text>
</TouchableOpacity>

## Danger Button
<TouchableOpacity
  className="bg-[#FEE2E2] h-[44px] rounded-xl
  items-center justify-center"
  activeOpacity={0.7}
  onPress={fn}
>
  <Text className="text-[#DC2626] text-sm font-medium">
    {t('key')}
  </Text>
</TouchableOpacity>

## Card
<View className="bg-white rounded-2xl shadow-sm p-4 mx-4 mb-3">
  {content}
</View>

## Section Title
<Text className="text-[#1A1A2E] text-lg font-bold mb-2 px-4">
  {t('key')}
</Text>

## Body Text
<Text className="text-[#1A1A2E] text-sm leading-6">
  {text}
</Text>

## Muted Text
<Text className="text-[#6B7280] text-xs">
  {text}
</Text>

## Text Input
<View className="mb-4">
  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">
    {label}
  </Text>
  <TextInput
    className="bg-white border border-[#E5E7EB] rounded-xl
    h-[48px] px-4 text-[#1A1A2E] text-base"
    value={value}
    onChangeText={setValue}
    placeholder={placeholder}
    placeholderTextColor="#9CA3AF"
  />
</View>

## Text Area
<View className="mb-4">
  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">
    {label}
  </Text>
  <TextInput
    className="bg-white border border-[#E5E7EB] rounded-xl
    p-4 text-[#1A1A2E] text-base"
    value={value}
    onChangeText={setValue}
    multiline
    numberOfLines={4}
    textAlignVertical="top"
    placeholder={placeholder}
    placeholderTextColor="#9CA3AF"
  />
</View>

## Select (Picker wrapper)
<View className="mb-4">
  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">
    {label}
  </Text>
  <View className="bg-white border border-[#E5E7EB] rounded-xl h-[48px]
    justify-center px-4 flex-row items-center">
    <Text className="flex-1 text-[#1A1A2E] text-base">{selectedLabel}</Text>
    <Text className="text-[#6B7280]">▼</Text>
  </View>
</View>
Use a Modal with FlatList for the dropdown options.

## Badge — Available (Green)
<View className="bg-[#DCFCE7] rounded-full px-3 py-1 self-start">
  <Text className="text-[#15803D] text-xs font-medium">
    {t('common.available')}
  </Text>
</View>

## Badge — Booked (Red)
<View className="bg-[#FEE2E2] rounded-full px-3 py-1 self-start">
  <Text className="text-[#DC2626] text-xs font-medium">
    {t('common.booked')}
  </Text>
</View>

## Badge — Warning (Amber)
<View className="bg-[#FEF3C7] rounded-full px-3 py-1 self-start">
  <Text className="text-[#D97706] text-xs font-medium">
    {t('common.availableSoon')}
  </Text>
</View>

## Badge — Primary (Blue)
<View className="bg-[#E8EEFB] rounded-full px-3 py-1 self-start">
  <Text className="text-[#1A4FBA] text-xs font-medium">
    {label}
  </Text>
</View>

## Verified Badge
<View className="bg-[#E8EEFB] rounded-full px-2 py-0.5
  flex-row items-center gap-1 self-start">
  <Text className="text-[#1A4FBA] text-xs">✓</Text>
  <Text className="text-[#1A4FBA] text-xs font-medium">
    {t('common.verified')}
  </Text>
</View>

## Star Rating
<View className="flex-row gap-0.5">
  {[1,2,3,4,5].map(star => (
    <Text
      key={star}
      className={`text-base ${star <= rating
        ? 'text-[#F59E0B]'
        : 'text-[#E5E7EB]'}`}
    >★</Text>
  ))}
</View>

## Toggle Switch (custom)
<TouchableOpacity
  className={`w-[51px] h-[31px] rounded-full justify-center px-0.5
    ${isOn ? 'bg-[#1A4FBA]' : 'bg-[#E5E7EB]'}`}
  onPress={() => setIsOn(!isOn)}
  activeOpacity={0.9}
>
  <View className={`w-[27px] h-[27px] rounded-full bg-white shadow-sm
    ${isOn ? 'self-end' : 'self-start'}`} />
</TouchableOpacity>

## Gradient Header
import LinearGradient from 'react-native-linear-gradient'
<LinearGradient
  colors={['#1A4FBA', '#143D9B']}
  className="px-4 pb-6"
  style={{ paddingTop: insets.top + 12 }}
>
  {content}
</LinearGradient>

## Divider
<View className="h-px bg-[#E5E7EB] mx-4 my-2" />

## Screen Background
<View className="flex-1 bg-[#F5F7FA]">
  {content}
</View>

## Bottom Sheet (custom modal)
<Modal visible={isOpen} transparent animationType="slide">
  <View className="flex-1 bg-black/50 justify-end">
    <View className="bg-white rounded-t-3xl px-4 pt-3 pb-8">
      <View className="w-10 h-1 bg-[#E5E7EB] rounded-full self-center mb-4" />
      {content}
    </View>
  </View>
</Modal>

## Toast (custom)
Use a Zustand store to manage toast state.
Show as absolute positioned View at bottom:
<View className="absolute bottom-24 left-4 right-4 bg-[#1A1A2E]
  rounded-2xl px-4 py-3 flex-row items-center shadow-lg">
  <Text className="text-white text-sm font-medium flex-1">{message}</Text>
</View>
Auto dismiss after 3 seconds.

## Loading Skeleton
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
<SkeletonPlaceholder borderRadius={12} backgroundColor="#F0F0F0"
  highlightColor="#FAFAFA">
  <SkeletonPlaceholder.Item width="100%" height={80} marginBottom={12} />
  <SkeletonPlaceholder.Item width="70%" height={16} />
</SkeletonPlaceholder>

## Checkbox
<TouchableOpacity
  className="flex-row items-center gap-3"
  onPress={() => setChecked(!checked)}
>
  <View className={`w-5 h-5 rounded border-2 items-center justify-center
    ${checked ? 'bg-[#1A4FBA] border-[#1A4FBA]' : 'border-[#E5E7EB] bg-white'}`}>
    {checked && <Text className="text-white text-xs font-bold">✓</Text>}
  </View>
  <Text className="text-[#1A1A2E] text-sm flex-1">{label}</Text>
</TouchableOpacity>

Always check this file before building any screen or component.
