import React, {useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useAppStore} from '../store/appStore';
import LanguageToggle from '../components/common/LanguageToggle';

const GCC = require('../../../shared/mock/gcc_regions.json') as Record<string, string[]>;
const TAX = require('../../../shared/mock/taxonomy.json') as {
  manpower: {slug: string; label_en: string}[];
  machinery: {slug: string; label_en: string}[];
  vehicles: {slug: string; label_en: string}[];
  shipping: {slug: string; label_en: string}[];
};

type Category = 'manpower' | 'machinery' | 'shipping';
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Option {
  label: string;
  value: string;
}

interface PickerState {
  visible: boolean;
  title: string;
  options: Option[];
  onSelect: (value: string, label: string) => void;
}

const COUNTRY_OPTIONS: Option[] = Object.keys(GCC).map(c => ({label: c, value: c}));
const MP_ROLES: Option[] = TAX.manpower.map(r => ({label: r.label_en, value: r.slug}));
const MCH_TYPES: Option[] = [
  ...TAX.machinery.map(m => ({label: m.label_en, value: m.slug})),
  ...TAX.vehicles.map(v => ({label: v.label_en, value: v.slug})),
];
const SHP_TYPES: Option[] = TAX.shipping.map(s => ({label: s.label_en, value: s.slug}));
const SKILL_LEVELS: Option[] = [
  {label: 'Unskilled', value: 'unskilled'},
  {label: 'Semi-skilled', value: 'semi_skilled'},
  {label: 'Skilled', value: 'skilled'},
  {label: 'Specialist', value: 'specialist'},
];
const DURATIONS: Option[] = [
  {label: 'Daily', value: 'daily'},
  {label: 'Weekly', value: 'weekly'},
  {label: 'Monthly', value: 'monthly'},
  {label: 'Project Based', value: 'project'},
];

function getCities(country: string): Option[] {
  return (GCC[country] ?? []).map((c: string) => ({label: c, value: c}));
}

// ---------------------------------------------------------------------------
// Sub-components (outside to avoid recreation on each render)
// ---------------------------------------------------------------------------

function SelectField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{label}</Text>
      <TouchableOpacity
        className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 flex-row items-center"
        activeOpacity={0.7}
        onPress={onPress}
      >
        <Text
          className={`flex-1 text-base ${value ? 'text-[#1A1A2E]' : 'text-[#9CA3AF]'}`}
          numberOfLines={1}
        >
          {value || label}
        </Text>
        <Text className="text-[#6B7280]">▼</Text>
      </TouchableOpacity>
    </View>
  );
}

function ToggleSwitch({value, onToggle}: {value: boolean; onToggle: () => void}) {
  return (
    <TouchableOpacity
      className={`w-[51px] h-[31px] rounded-full justify-center px-0.5 ${
        value ? 'bg-[#1A4FBA]' : 'bg-[#E5E7EB]'
      }`}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View
        className={`w-[27px] h-[27px] rounded-full bg-white shadow-sm ${
          value ? 'self-end' : 'self-start'
        }`}
      />
    </TouchableOpacity>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="flex-1 mb-4">
      <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{label}</Text>
      <TextInput
        className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
        value={value}
        onChangeText={onChange}
        placeholder="DD/MM/YYYY"
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Animated category card
// ---------------------------------------------------------------------------

function CategoryCard({
  card,
  isActive,
  onPress,
  label,
}: {
  card: {key: string; emoji: string; accent: string};
  isActive: boolean;
  onPress: () => void;
  label: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {toValue: 0.97, useNativeDriver: true, speed: 200, bounciness: 0}).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 80, bounciness: 6}).start();
  };

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          width: 140,
          height: 110,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 12,
          justifyContent: 'space-between',
          borderTopWidth: 3,
          borderTopColor: card.accent,
          shadowColor: '#1A4FBA',
          shadowOffset: {width: 0, height: isActive ? 6 : 3},
          shadowOpacity: isActive ? 0.15 : 0.07,
          shadowRadius: isActive ? 14 : 8,
          elevation: isActive ? 6 : 3,
        }}
      >
        <Text style={{fontSize: 32}}>{card.emoji}</Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: isActive ? card.accent : '#1A1A2E',
          }}
          numberOfLines={2}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

const CARD_DEFS: {key: Category; emoji: string; labelKey: string; accent: string}[] = [
  {key: 'manpower', emoji: '👷', labelKey: 'home.manpower', accent: '#1A4FBA'},
  {key: 'machinery', emoji: '🏗️', labelKey: 'home.machinery', accent: '#F59E0B'},
  {key: 'shipping', emoji: '📦', labelKey: 'home.shipping', accent: '#22C55E'},
];

export default function HomeScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {unreadCount, recentSearches, addRecentSearch} = useAppStore();

  const [activeCategory, setActiveCategory] = useState<Category>('manpower');

  // Manpower form state
  const [mpRole, setMpRole] = useState('');
  const [mpRoleLabel, setMpRoleLabel] = useState('');
  const [mpQty, setMpQty] = useState('');
  const [mpCountry, setMpCountry] = useState('');
  const [mpCity, setMpCity] = useState('');
  const [mpDateFrom, setMpDateFrom] = useState('');
  const [mpDateTo, setMpDateTo] = useState('');
  const [mpSkill, setMpSkill] = useState('');
  const [mpSkillLabel, setMpSkillLabel] = useState('');

  // Machinery form state
  const [mchType, setMchType] = useState('');
  const [mchTypeLabel, setMchTypeLabel] = useState('');
  const [mchQty, setMchQty] = useState('');
  const [mchOperator, setMchOperator] = useState(false);
  const [mchDuration, setMchDuration] = useState('');
  const [mchDurationLabel, setMchDurationLabel] = useState('');
  const [mchCountry, setMchCountry] = useState('');
  const [mchCity, setMchCity] = useState('');

  // Shipping form state
  const [shpType, setShpType] = useState('');
  const [shpTypeLabel, setShpTypeLabel] = useState('');
  const [shpWeight, setShpWeight] = useState('');
  const [shpFragile, setShpFragile] = useState(false);
  const [shpHazmat, setShpHazmat] = useState(false);
  const [shpColdChain, setShpColdChain] = useState(false);
  const [shpPickupCountry, setShpPickupCountry] = useState('');
  const [shpPickupCity, setShpPickupCity] = useState('');
  const [shpDropoffCountry, setShpDropoffCountry] = useState('');
  const [shpDropoffCity, setShpDropoffCity] = useState('');
  const [shpDateFrom, setShpDateFrom] = useState('');
  const [shpDateTo, setShpDateTo] = useState('');

  // Shared picker modal
  const [picker, setPicker] = useState<PickerState>({
    visible: false,
    title: '',
    options: [],
    onSelect: () => {},
  });

  const openPicker = (
    title: string,
    options: Option[],
    onSelect: (value: string, label: string) => void,
  ) => setPicker({visible: true, title, options, onSelect});

  const closePicker = () => setPicker(p => ({...p, visible: false}));

  // -------------------------------------------------------------------------
  // Search handler
  // -------------------------------------------------------------------------

  const handleSearch = () => {
    let params: Record<string, unknown> = {};
    let label = '';
    let city = '';
    let country = '';

    if (activeCategory === 'manpower') {
      params = {role: mpRole, quantity: mpQty, country: mpCountry, city: mpCity, dateFrom: mpDateFrom, dateTo: mpDateTo, skillLevel: mpSkill};
      label = mpRoleLabel || t('home.manpower');
      city = mpCity;
      country = mpCountry;
    } else if (activeCategory === 'machinery') {
      params = {type: mchType, quantity: mchQty, needsOperator: mchOperator, duration: mchDuration, country: mchCountry, city: mchCity};
      label = mchTypeLabel || t('home.machinery');
      city = mchCity;
      country = mchCountry;
    } else {
      params = {packageType: shpType, weight: shpWeight, fragile: shpFragile, hazmat: shpHazmat, coldChain: shpColdChain, pickupCountry: shpPickupCountry, pickupCity: shpPickupCity, dropoffCountry: shpDropoffCountry, dropoffCity: shpDropoffCity, dateFrom: shpDateFrom, dateTo: shpDateTo};
      label = shpTypeLabel || t('home.shipping');
      city = shpPickupCity;
      country = shpPickupCountry;
    }

    addRecentSearch({
      id: `${activeCategory}_${label}_${city}`.replace(/\s/g, '_'),
      label,
      category: activeCategory,
      params,
    });

    navigation.navigate('SearchResults', {
      category: activeCategory,
      params: {city, country, ...params},
    });
  };

  const applyRecentSearch = (item: (typeof recentSearches)[0]) => {
    setActiveCategory(item.category as Category);
    const p = item.params;
    if (item.category === 'manpower') {
      if (p.role) {setMpRole(p.role as string); setMpRoleLabel(item.label);}
      if (p.country) setMpCountry(p.country as string);
      if (p.city) setMpCity(p.city as string);
    } else if (item.category === 'machinery') {
      if (p.type) {setMchType(p.type as string); setMchTypeLabel(item.label);}
      if (p.country) setMchCountry(p.country as string);
      if (p.city) setMchCity(p.city as string);
    } else {
      if (p.packageType) {setShpType(p.packageType as string); setShpTypeLabel(item.label);}
      if (p.pickupCountry) setShpPickupCountry(p.pickupCountry as string);
      if (p.pickupCity) setShpPickupCity(p.pickupCity as string);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      <ScrollView bounces showsVerticalScrollIndicator={false}>

        {/* ── SECTION 1: GRADIENT HEADER ── */}
        <LinearGradient
          colors={['#1A4FBA', '#143D9B']}
          className="px-4 pb-6"
          style={{paddingTop: insets.top + 16}}
        >
          {/* Row 1 */}
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold">EJJAR</Text>
            <View className="flex-row items-center gap-3">
              <LanguageToggle />
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                className="relative"
                activeOpacity={0.8}
              >
                <Text style={{fontSize: 24}}>🔔</Text>
                {unreadCount > 0 && (
                  <View
                    className="absolute bg-[#EF4444] rounded-full items-center justify-center"
                    style={{top: 0, right: 0, width: 16, height: 16}}
                  >
                    <Text className="text-white font-bold" style={{fontSize: 9}}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2 */}
          <View style={{marginTop: 16}}>
            <Text className="text-white text-2xl font-bold">{t('home.title')}</Text>
            <Text className="text-white/80 text-sm mt-1">{t('home.subtitle')}</Text>
          </View>
        </LinearGradient>

        {/* ── SECTION 2: CATEGORY CARDS ── */}
        <View style={{marginTop: -20}}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 8, gap: 12}}
          >
            {CARD_DEFS.map(card => (
              <CategoryCard
                key={card.key}
                card={card}
                isActive={activeCategory === card.key}
                onPress={() => setActiveCategory(card.key)}
                label={t(card.labelKey)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── SECTION 3: SEARCH FORM ── */}
        <View className="px-4 pt-5">

          {/* Tab pills */}
          <View className="flex-row gap-2">
            {CARD_DEFS.map(card => {
              const isActive = activeCategory === card.key;
              return (
                <TouchableOpacity
                  key={card.key}
                  onPress={() => setActiveCategory(card.key)}
                  className={`rounded-full px-4 py-2 ${
                    isActive ? 'bg-[#1A4FBA]' : 'bg-white border border-[#E5E7EB]'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-sm ${
                      isActive ? 'text-white font-semibold' : 'text-[#6B7280]'
                    }`}
                  >
                    {t(card.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form card */}
          <View className="bg-white rounded-2xl shadow-sm p-4 mt-4">

            {/* ─ MANPOWER FORM ─ */}
            {activeCategory === 'manpower' && (
              <>
                <SelectField
                  label={t('home.role')}
                  value={mpRoleLabel}
                  onPress={() =>
                    openPicker(t('home.role'), MP_ROLES, (v, l) => {
                      setMpRole(v);
                      setMpRoleLabel(l);
                      closePicker();
                    })
                  }
                />
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">
                    {t('home.quantity')}
                  </Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={mpQty}
                    onChangeText={setMpQty}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <SelectField
                      label={t('home.country')}
                      value={mpCountry}
                      onPress={() =>
                        openPicker(t('common.selectCountry'), COUNTRY_OPTIONS, (v, _l) => {
                          setMpCountry(v);
                          setMpCity('');
                          closePicker();
                        })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <SelectField
                      label={t('home.city')}
                      value={mpCity}
                      onPress={() =>
                        openPicker(t('common.selectCity'), getCities(mpCountry), (v, _l) => {
                          setMpCity(v);
                          closePicker();
                        })
                      }
                    />
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <DateField label={t('home.dateFrom')} value={mpDateFrom} onChange={setMpDateFrom} />
                  <View className="w-3" />
                  <DateField label={t('home.dateTo')} value={mpDateTo} onChange={setMpDateTo} />
                </View>
                <SelectField
                  label={t('home.skillLevel')}
                  value={mpSkillLabel}
                  onPress={() =>
                    openPicker(t('home.skillLevel'), SKILL_LEVELS, (v, l) => {
                      setMpSkill(v);
                      setMpSkillLabel(l);
                      closePicker();
                    })
                  }
                />
              </>
            )}

            {/* ─ MACHINERY FORM ─ */}
            {activeCategory === 'machinery' && (
              <>
                <SelectField
                  label={t('home.machinery')}
                  value={mchTypeLabel}
                  onPress={() =>
                    openPicker(t('home.machinery'), MCH_TYPES, (v, l) => {
                      setMchType(v);
                      setMchTypeLabel(l);
                      closePicker();
                    })
                  }
                />
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">
                    {t('home.quantity')}
                  </Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={mchQty}
                    onChangeText={setMchQty}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium">
                    {t('home.operatorNeeded')}
                  </Text>
                  <ToggleSwitch value={mchOperator} onToggle={() => setMchOperator(v => !v)} />
                </View>
                <SelectField
                  label={t('home.duration')}
                  value={mchDurationLabel}
                  onPress={() =>
                    openPicker(t('home.duration'), DURATIONS, (v, l) => {
                      setMchDuration(v);
                      setMchDurationLabel(l);
                      closePicker();
                    })
                  }
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <SelectField
                      label={t('home.country')}
                      value={mchCountry}
                      onPress={() =>
                        openPicker(t('common.selectCountry'), COUNTRY_OPTIONS, (v, _l) => {
                          setMchCountry(v);
                          setMchCity('');
                          closePicker();
                        })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <SelectField
                      label={t('home.city')}
                      value={mchCity}
                      onPress={() =>
                        openPicker(t('common.selectCity'), getCities(mchCountry), (v, _l) => {
                          setMchCity(v);
                          closePicker();
                        })
                      }
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─ SHIPPING FORM ─ */}
            {activeCategory === 'shipping' && (
              <>
                <SelectField
                  label={t('home.packageType')}
                  value={shpTypeLabel}
                  onPress={() =>
                    openPicker(t('home.packageType'), SHP_TYPES, (v, l) => {
                      setShpType(v);
                      setShpTypeLabel(l);
                      closePicker();
                    })
                  }
                />
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">
                    {t('home.weight')}
                  </Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={shpWeight}
                    onChangeText={setShpWeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {/* 3 toggles */}
                <View className="flex-row justify-around mb-5">
                  {[
                    {label: t('home.fragile'), val: shpFragile, fn: () => setShpFragile(v => !v)},
                    {label: t('home.hazmat'), val: shpHazmat, fn: () => setShpHazmat(v => !v)},
                    {label: t('home.coldChain'), val: shpColdChain, fn: () => setShpColdChain(v => !v)},
                  ].map(toggle => (
                    <View key={toggle.label} className="items-center gap-2">
                      <Text className="text-[#1A1A2E] text-xs font-medium text-center">
                        {toggle.label}
                      </Text>
                      <ToggleSwitch value={toggle.val} onToggle={toggle.fn} />
                    </View>
                  ))}
                </View>
                {/* Pickup */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <SelectField
                      label={t('home.pickupCountry')}
                      value={shpPickupCountry}
                      onPress={() =>
                        openPicker(t('common.selectCountry'), COUNTRY_OPTIONS, (v, _l) => {
                          setShpPickupCountry(v);
                          setShpPickupCity('');
                          closePicker();
                        })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <SelectField
                      label={t('home.pickupCity')}
                      value={shpPickupCity}
                      onPress={() =>
                        openPicker(t('common.selectCity'), getCities(shpPickupCountry), (v, _l) => {
                          setShpPickupCity(v);
                          closePicker();
                        })
                      }
                    />
                  </View>
                </View>
                {/* Dropoff */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <SelectField
                      label={t('home.dropoffCountry')}
                      value={shpDropoffCountry}
                      onPress={() =>
                        openPicker(t('common.selectCountry'), COUNTRY_OPTIONS, (v, _l) => {
                          setShpDropoffCountry(v);
                          setShpDropoffCity('');
                          closePicker();
                        })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <SelectField
                      label={t('home.dropoffCity')}
                      value={shpDropoffCity}
                      onPress={() =>
                        openPicker(t('common.selectCity'), getCities(shpDropoffCountry), (v, _l) => {
                          setShpDropoffCity(v);
                          closePicker();
                        })
                      }
                    />
                  </View>
                </View>
                {/* Dates */}
                <View className="flex-row gap-3">
                  <DateField label={t('home.dateFrom')} value={shpDateFrom} onChange={setShpDateFrom} />
                  <View className="w-3" />
                  <DateField label={t('home.dateTo')} value={shpDateTo} onChange={setShpDateTo} />
                </View>
              </>
            )}
          </View>

          {/* ── SEARCH BUTTON ── */}
          <TouchableOpacity
            className="mx-4 mb-6 mt-4 rounded-2xl overflow-hidden"
            activeOpacity={0.85}
            onPress={handleSearch}
            style={{
              shadowColor: '#1A4FBA',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={['#1E56CC', '#1A4FBA']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              className="h-[52px] items-center justify-center"
            >
              <Text className="text-white text-base font-semibold tracking-wide">
                {t('common.search')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── RECENT SEARCHES ── */}
          {recentSearches.length > 0 && (
            <View className="mb-8">
              <Text className="text-xs text-[#6B7280] mb-2">{t('home.recentSearches')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {recentSearches.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      className="bg-[#E8EEFB] rounded-full px-3 py-1"
                      activeOpacity={0.7}
                      onPress={() => applyRecentSearch(item)}
                    >
                      <Text className="text-[#1A4FBA] text-xs">{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── PICKER MODAL ── */}
      <Modal
        visible={picker.visible}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={closePicker}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-t-3xl px-4 pt-3 pb-8"
          >
            <View className="w-10 h-1 bg-[#E5E7EB] rounded-full self-center mb-4" />
            <Text className="text-[#1A1A2E] text-lg font-bold mb-3">{picker.title}</Text>
            <FlatList
              data={picker.options}
              keyExtractor={item => item.value}
              style={{maxHeight: 340}}
              ItemSeparatorComponent={() => <View className="h-px bg-[#F5F7FA]" />}
              renderItem={({item}) => (
                <TouchableOpacity
                  className="py-4 px-2"
                  activeOpacity={0.7}
                  onPress={() => picker.onSelect(item.value, item.label)}
                >
                  <Text className="text-[#1A1A2E] text-base">{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
