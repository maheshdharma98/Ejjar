import React, {useRef, useState} from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePickerInput from '../components/common/DatePickerInput';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import Icon from '../components/common/Icon';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useAppStore} from '../store/appStore';
import LanguageToggle from '../components/common/LanguageToggle';
import {colors, shadows} from '../theme/designSystem';
import {useDemoStore} from '../store/demoStore';
import DemoTooltip from '../components/common/DemoTooltip';
import DemoFloatingBar from '../components/common/DemoFloatingBar';
import EjjarLogo from '../components/common/EjjarLogo';

const TAX = require('../../../shared/mock/taxonomy.json') as {
  manpower: {slug: string; label_en: string}[];
  machinery: {slug: string; label_en: string}[];
  vehicles: {slug: string; label_en: string}[];
  shipping: {slug: string; label_en: string}[];
};

type Category = 'manpower' | 'machinery' | 'shipping' | 'electrical' | 'civil';
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

const OMAN_CITIES: Option[] = [
  'Muscat',
  'Sohar',
  'Salalah',
  'Nizwa',
  'Sur',
  'Duqm',
  'Ibri',
  'Rustaq',
].map(c => ({label: c, value: c}));
const MP_ROLES: Option[] = TAX.manpower.map(r => ({
  label: r.label_en,
  value: r.slug,
}));
const MCH_TYPES: Option[] = [
  ...TAX.machinery.map(m => ({label: m.label_en, value: m.slug})),
  ...TAX.vehicles.map(v => ({label: v.label_en, value: v.slug})),
];
const SHP_TYPES: Option[] = TAX.shipping.map(s => ({
  label: s.label_en,
  value: s.slug,
}));
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

// ---------------------------------------------------------------------------
// Field sub-components
// ---------------------------------------------------------------------------

function FieldLabel({label}: {label: string}) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
      }}>
      {label}
    </Text>
  );
}

function IconSelectField({
  label,
  value,
  onPress,
  iconName,
}: {
  label: string;
  value: string;
  onPress: () => void;
  iconName: string;
}) {
  const filled = !!value;
  return (
    <View style={{marginBottom: 14}}>
      <FieldLabel label={label} />
      <TouchableOpacity
        style={{
          backgroundColor: filled ? '#FFFAF7' : '#F8FAFC',
          borderWidth: 1.5,
          borderColor: filled ? '#E67E3A' : '#E2E8F0',
          borderRadius: 12,
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
        }}
        activeOpacity={0.7}
        onPress={onPress}>
        <Icon name={iconName} size={16} color="#C9974A" />
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            color: value ? colors.textPrimary : '#bbb',
            marginStart: 10,
          }}
          numberOfLines={1}>
          {value || label}
        </Text>
        <Icon name="chevron-down" size={14} color="#bbb" />
      </TouchableOpacity>
    </View>
  );
}

function IconTextInput({
  label,
  value,
  onChange,
  iconName,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  iconName: string;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
}) {
  const [focused, setFocused] = useState(false);
  const filled = !!value;
  return (
    <View style={{marginBottom: 14}}>
      <FieldLabel label={label} />
      <View
        style={{
          backgroundColor: focused || filled ? '#FFFAF7' : '#F8FAFC',
          borderWidth: 1.5,
          borderColor: focused || filled ? '#E67E3A' : '#E2E8F0',
          borderRadius: 12,
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
        }}>
        <Icon name={iconName} size={16} color="#C9974A" />
        <TextInput
          style={{
            flex: 1,
            fontSize: 14,
            color: colors.textPrimary,
            marginStart: 10,
          }}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? ''}
          placeholderTextColor="#bbb"
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

function ToggleSwitch({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 2,
        backgroundColor: value ? '#101828' : '#E2E8F0',
      }}
      onPress={onToggle}
      activeOpacity={0.9}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#F8FAFC',
          alignSelf: value ? 'flex-end' : 'flex-start',
          ...shadows.sm,
        }}
      />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Category card — horizontal scroll strip
// ---------------------------------------------------------------------------

interface CategoryDef {
  key: Category;
  iconName: string;
  label: string;
  labelKey: string;
  bgColor: string;
  iconColor: string;
  count: number;
}

const CARD_DEFS: CategoryDef[] = [
  {
    key: 'manpower',
    iconName: 'account-hard-hat',
    label: 'Manpower',
    labelKey: 'home.manpower',
    bgColor: '#FFF0D6',
    iconColor: '#C9974A',
    count: 124,
  },
  {
    key: 'machinery',
    iconName: 'crane',
    label: 'Machinery',
    labelKey: 'home.machinery',
    bgColor: '#E0F2FE',
    iconColor: '#0369A1',
    count: 38,
  },
  {
    key: 'shipping',
    iconName: 'package-variant',
    label: 'Shipping',
    labelKey: 'home.shipping',
    bgColor: '#FEF3C7',
    iconColor: '#D97706',
    count: 15,
  },
  {
    key: 'electrical',
    iconName: 'lightning-bolt',
    label: 'Electrical',
    labelKey: 'home.electrical',
    bgColor: '#DCFCE7',
    iconColor: '#166534',
    count: 22,
  },
  {
    key: 'civil',
    iconName: 'office-building',
    label: 'Civil',
    labelKey: 'home.civil',
    bgColor: '#F3E8FF',
    iconColor: '#7C3AED',
    count: 9,
  },
];

function CategoryCard({
  cat,
  isActive,
  label,
  onPress,
}: {
  cat: CategoryDef;
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        minWidth: 90,
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: isActive ? '#E67E3A' : '#E2E8F0',
      }}>
      {/* Top zone — colored */}
      <View
        style={{
          height: 64,
          backgroundColor: cat.bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
        <Icon name={cat.iconName as any} size={26} color={cat.iconColor} />
        {/* Count badge */}
        {cat.count > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              backgroundColor: '#101828',
              borderRadius: 999,
              paddingHorizontal: 5,
              paddingVertical: 2,
            }}>
            <Text style={{fontSize: 8, fontWeight: '700', color: '#FFFFFF'}}>
              {cat.count}
            </Text>
          </View>
        )}
      </View>
      {/* Bottom label */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 6,
          paddingVertical: 8,
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: isActive ? '#E67E3A' : '#0F172A',
            lineHeight: 14,
            textAlign: 'center',
          }}
          numberOfLines={1}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const {t, i18n} = useTranslation();
  const {t: tDemo} = useTranslation('demo');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {unreadCount, recentSearches, addRecentSearch} = useAppStore();
  const {isActive, currentStep, startDemo, nextStep} = useDemoStore();

  const [activeCategory, setActiveCategory] = useState<Category>('manpower');

  const scrollViewRef = useRef<ScrollView>(null);
  const formYRef = useRef(0);

  const resetFormFields = () => {
    setMpRole('');
    setMpRoleLabel('');
    setMpQty('');
    setMpCity('');
    setMpDateFrom(null);
    setMpDateTo(null);
    setMpSkill('');
    setMpSkillLabel('');
    setMchType('');
    setMchTypeLabel('');
    setMchQty('');
    setMchOperator(false);
    setMchDuration('');
    setMchDurationLabel('');
    setMchCity('');
    setShpType('');
    setShpTypeLabel('');
    setShpWeight('');
    setShpFragile(false);
    setShpHazmat(false);
    setShpColdChain(false);
    setShpPickupCity('');
    setShpDropoffCity('');
    setShpDateFrom(null);
    setShpDateTo(null);
  };

  const handleCategorySelect = (categoryId: Category) => {
    setActiveCategory(categoryId);
    resetFormFields();
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: formYRef.current - 20,
        animated: true,
      });
    }, 50);
  };

  const [mpRole, setMpRole] = useState('');
  const [mpRoleLabel, setMpRoleLabel] = useState('');
  const [mpQty, setMpQty] = useState('');
  const [mpCountry] = useState('Oman');
  const [mpCity, setMpCity] = useState('');
  const [mpDateFrom, setMpDateFrom] = useState<Date | null>(null);
  const [mpDateTo, setMpDateTo] = useState<Date | null>(null);
  const [mpSkill, setMpSkill] = useState('');
  const [mpSkillLabel, setMpSkillLabel] = useState('');

  const [mchType, setMchType] = useState('');
  const [mchTypeLabel, setMchTypeLabel] = useState('');
  const [mchQty, setMchQty] = useState('');
  const [mchOperator, setMchOperator] = useState(false);
  const [mchDuration, setMchDuration] = useState('');
  const [mchDurationLabel, setMchDurationLabel] = useState('');
  const [mchCountry] = useState('Oman');
  const [mchCity, setMchCity] = useState('');

  const [shpType, setShpType] = useState('');
  const [shpTypeLabel, setShpTypeLabel] = useState('');
  const [shpWeight, setShpWeight] = useState('');
  const [shpFragile, setShpFragile] = useState(false);
  const [shpHazmat, setShpHazmat] = useState(false);
  const [shpColdChain, setShpColdChain] = useState(false);
  const [shpPickupCountry] = useState('Oman');
  const [shpPickupCity, setShpPickupCity] = useState('');
  const [shpDropoffCountry] = useState('Oman');
  const [shpDropoffCity, setShpDropoffCity] = useState('');
  const [shpDateFrom, setShpDateFrom] = useState<Date | null>(null);
  const [shpDateTo, setShpDateTo] = useState<Date | null>(null);

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

  const handleSearch = () => {
    if (activeCategory === 'electrical' || activeCategory === 'civil') {
      return;
    }

    let params: Record<string, unknown> = {};
    let label = '';
    let city = '';
    let country = '';

    if (activeCategory === 'manpower') {
      params = {
        role: mpRole,
        quantity: mpQty,
        country: mpCountry,
        city: mpCity,
        dateFrom: mpDateFrom?.toISOString() ?? '',
        dateTo: mpDateTo?.toISOString() ?? '',
        skillLevel: mpSkill,
      };
      label = mpRoleLabel || t('home.manpower');
      city = mpCity;
      country = mpCountry;
    } else if (activeCategory === 'machinery') {
      params = {
        type: mchType,
        quantity: mchQty,
        needsOperator: mchOperator,
        duration: mchDuration,
        country: mchCountry,
        city: mchCity,
      };
      label = mchTypeLabel || t('home.machinery');
      city = mchCity;
      country = mchCountry;
    } else {
      params = {
        packageType: shpType,
        weight: shpWeight,
        fragile: shpFragile,
        hazmat: shpHazmat,
        coldChain: shpColdChain,
        pickupCountry: shpPickupCountry,
        pickupCity: shpPickupCity,
        dropoffCountry: shpDropoffCountry,
        dropoffCity: shpDropoffCity,
        dateFrom: shpDateFrom?.toISOString() ?? '',
        dateTo: shpDateTo?.toISOString() ?? '',
      };
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
      if (p.role) {
        setMpRole(p.role as string);
        setMpRoleLabel(item.label);
      }
      if (p.city) {
        setMpCity(p.city as string);
      }
    } else if (item.category === 'machinery') {
      if (p.type) {
        setMchType(p.type as string);
        setMchTypeLabel(item.label);
      }
      if (p.city) {
        setMchCity(p.city as string);
      }
    } else {
      if (p.packageType) {
        setShpType(p.packageType as string);
        setShpTypeLabel(item.label);
      }
      if (p.pickupCity) {
        setShpPickupCity(p.pickupCity as string);
      }
    }
  };

  const isComingSoon =
    activeCategory === 'electrical' || activeCategory === 'civil';

  return (
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>
      <ScrollView
        ref={scrollViewRef}
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 90}}>
        {/* HEADER — dark navy */}
        <View
          style={{
            backgroundColor: '#101828',
            paddingTop: insets.top + 16,
            paddingHorizontal: 16,
            paddingBottom: 28,
            shadowColor: '#101828',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 8,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <EjjarLogo variant="white" width={50} height={44} />
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <LanguageToggle />
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.8}
                style={{position: 'relative'}}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Icon name="bell-outline" size={24} color="#64748B" />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      borderRadius: 9999,
                      backgroundColor: '#E67E3A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        color: '#ffffff',
                        fontSize: 9,
                        fontWeight: '600',
                      }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text
            style={{
              color: '#ffffff',
              fontSize: 20,
              fontWeight: '600',
              marginTop: 16,
            }}>
            {t('home.title')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              gap: 4,
            }}>
            <Icon name="map-marker-outline" size={13} color="#64748B" />
            <Text style={{color: '#64748B', fontSize: 12}}>
              {t('home.subtitle')}
            </Text>
          </View>
        </View>

        {/* CATEGORY CARDS — horizontal scroll strip, floats over header */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginTop: -18, zIndex: 3}}
          contentContainerStyle={{
            flexDirection: 'row',
            paddingHorizontal: 14,
            gap: 8,
          }}>
          {CARD_DEFS.map(cat => (
            <CategoryCard
              key={cat.key}
              cat={cat}
              isActive={activeCategory === cat.key}
              label={t(cat.labelKey, {defaultValue: cat.label})}
              onPress={() => handleCategorySelect(cat.key)}
            />
          ))}
        </ScrollView>

        {/* DEMO BANNER */}
        {!isActive && (
          <TouchableOpacity
            onPress={startDemo}
            activeOpacity={0.85}
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              marginBottom: 12,
              backgroundColor: '#101828',
              borderRadius: 14,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: '#E67E3A',
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="play" size={18} color="#ffffff" />
            </View>
            <View style={{flex: 1}}>
              <Text style={{color: '#ffffff', fontWeight: '600', fontSize: 13}}>
                {i18n.language === 'ar'
                  ? 'جولة تعريفية بإيجار'
                  : 'Watch Demo Tour'}
              </Text>
              <Text style={{color: '#64748B', fontSize: 11, marginTop: 2}}>
                {i18n.language === 'ar'
                  ? 'شاهد كيف تعمل إيجار في دقيقتين'
                  : 'See how EJJAR works in 2 minutes'}
              </Text>
            </View>
            <Icon name="arrow-right" size={18} color="#E67E3A" />
          </TouchableOpacity>
        )}

        {/* FORM SECTION */}
        <View
          style={{paddingHorizontal: 16, paddingTop: 16}}
          onLayout={e => {
            formYRef.current = e.nativeEvent.layout.y;
          }}>
          {/* Segmented tab pills — horizontal scroll, all categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{marginBottom: 16}}
            contentContainerStyle={{flexDirection: 'row', gap: 6}}>
            {CARD_DEFS.map(card => {
              const isTabActive = activeCategory === card.key;
              return (
                <TouchableOpacity
                  key={card.key}
                  onPress={() => setActiveCategory(card.key)}
                  style={{
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    backgroundColor: isTabActive ? '#101828' : 'transparent',
                    borderWidth: 1.5,
                    borderColor: isTabActive ? '#101828' : '#E2E8F0',
                  }}
                  activeOpacity={0.8}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: isTabActive ? '#ffffff' : '#64748B',
                    }}>
                    {t(card.labelKey, {defaultValue: card.label})}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Form card */}
          <View
            style={[
              {
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              },
              shadows.md,
            ]}>
            {/* MANPOWER */}
            {activeCategory === 'manpower' && (
              <>
                <IconSelectField
                  label={t('home.role')}
                  value={mpRoleLabel}
                  iconName="account-tie"
                  onPress={() =>
                    openPicker(t('home.role'), MP_ROLES, (v, l) => {
                      setMpRole(v);
                      setMpRoleLabel(l);
                      closePicker();
                    })
                  }
                />
                <IconTextInput
                  label={t('home.quantity')}
                  value={mpQty}
                  onChange={setMpQty}
                  iconName="counter"
                  placeholder="1"
                  keyboardType="number-pad"
                />
                <View style={{flexDirection: 'row', gap: 10}}>
                  <View style={{flex: 1}}>
                    <View style={{marginBottom: 14}}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          marginBottom: 6,
                        }}>
                        {t('home.country')}
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1.5,
                          borderColor: '#E2E8F0',
                          borderRadius: 12,
                          height: 48,
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          gap: 6,
                        }}>
                        <Text style={{fontSize: 16}}>🇴🇲</Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textPrimary,
                            fontWeight: '500',
                          }}>
                          {i18n.language === 'ar' ? 'عُمان' : 'Oman'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{flex: 1}}>
                    <IconSelectField
                      label={t('home.city')}
                      value={mpCity}
                      iconName="map-marker-outline"
                      onPress={() =>
                        openPicker(
                          t('common.selectCity'),
                          OMAN_CITIES,
                          (v, _l) => {
                            setMpCity(v);
                            closePicker();
                          },
                        )
                      }
                    />
                  </View>
                </View>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <DatePickerInput
                    label={t('home.dateFrom')}
                    value={mpDateFrom}
                    onChange={setMpDateFrom}
                    minimumDate={new Date()}
                    flex={1}
                  />
                  <DatePickerInput
                    label={t('home.dateTo')}
                    value={mpDateTo}
                    onChange={setMpDateTo}
                    minimumDate={mpDateFrom ?? new Date()}
                    flex={1}
                  />
                </View>
                <IconSelectField
                  label={t('home.skillLevel')}
                  value={mpSkillLabel}
                  iconName="school-outline"
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

            {/* MACHINERY */}
            {activeCategory === 'machinery' && (
              <>
                <IconSelectField
                  label={t('home.machinery')}
                  value={mchTypeLabel}
                  iconName="crane"
                  onPress={() =>
                    openPicker(t('home.machinery'), MCH_TYPES, (v, l) => {
                      setMchType(v);
                      setMchTypeLabel(l);
                      closePicker();
                    })
                  }
                />
                <IconTextInput
                  label={t('home.quantity')}
                  value={mchQty}
                  onChange={setMchQty}
                  iconName="counter"
                  placeholder="1"
                  keyboardType="number-pad"
                />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <Icon name="account-hard-hat" size={16} color="#C9974A" />
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textPrimary,
                        fontWeight: '500',
                      }}>
                      {t('home.operatorNeeded')}
                    </Text>
                  </View>
                  <ToggleSwitch
                    value={mchOperator}
                    onToggle={() => setMchOperator(v => !v)}
                  />
                </View>
                <IconSelectField
                  label={t('home.duration')}
                  value={mchDurationLabel}
                  iconName="clock-outline"
                  onPress={() =>
                    openPicker(t('home.duration'), DURATIONS, (v, l) => {
                      setMchDuration(v);
                      setMchDurationLabel(l);
                      closePicker();
                    })
                  }
                />
                <View style={{flexDirection: 'row', gap: 10}}>
                  <View style={{flex: 1}}>
                    <View style={{marginBottom: 14}}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          marginBottom: 6,
                        }}>
                        {t('home.country')}
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1.5,
                          borderColor: '#E2E8F0',
                          borderRadius: 12,
                          height: 48,
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          gap: 6,
                        }}>
                        <Text style={{fontSize: 16}}>🇴🇲</Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textPrimary,
                            fontWeight: '500',
                          }}>
                          {i18n.language === 'ar' ? 'عُمان' : 'Oman'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{flex: 1}}>
                    <IconSelectField
                      label={t('home.city')}
                      value={mchCity}
                      iconName="map-marker-outline"
                      onPress={() =>
                        openPicker(
                          t('common.selectCity'),
                          OMAN_CITIES,
                          (v, _l) => {
                            setMchCity(v);
                            closePicker();
                          },
                        )
                      }
                    />
                  </View>
                </View>
              </>
            )}

            {/* SHIPPING */}
            {activeCategory === 'shipping' && (
              <>
                <IconSelectField
                  label={t('home.packageType')}
                  value={shpTypeLabel}
                  iconName="package-variant-closed"
                  onPress={() =>
                    openPicker(t('home.packageType'), SHP_TYPES, (v, l) => {
                      setShpType(v);
                      setShpTypeLabel(l);
                      closePicker();
                    })
                  }
                />
                <IconTextInput
                  label={t('home.weight')}
                  value={shpWeight}
                  onChange={setShpWeight}
                  iconName="weight-kilogram"
                  placeholder="0 kg"
                  keyboardType="decimal-pad"
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    marginBottom: 14,
                  }}>
                  {[
                    {
                      label: t('home.fragile'),
                      val: shpFragile,
                      fn: () => setShpFragile(v => !v),
                    },
                    {
                      label: t('home.hazmat'),
                      val: shpHazmat,
                      fn: () => setShpHazmat(v => !v),
                    },
                    {
                      label: t('home.coldChain'),
                      val: shpColdChain,
                      fn: () => setShpColdChain(v => !v),
                    },
                  ].map(toggle => (
                    <View
                      key={toggle.label}
                      style={{alignItems: 'center', gap: 6}}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textPrimary,
                          fontWeight: '500',
                          textAlign: 'center',
                        }}>
                        {toggle.label}
                      </Text>
                      <ToggleSwitch value={toggle.val} onToggle={toggle.fn} />
                    </View>
                  ))}
                </View>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <View style={{flex: 1}}>
                    <View style={{marginBottom: 14}}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          marginBottom: 6,
                        }}>
                        {t('home.pickupCountry')}
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1.5,
                          borderColor: '#E2E8F0',
                          borderRadius: 12,
                          height: 48,
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          gap: 6,
                        }}>
                        <Text style={{fontSize: 16}}>🇴🇲</Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textPrimary,
                            fontWeight: '500',
                          }}>
                          {i18n.language === 'ar' ? 'عُمان' : 'Oman'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{flex: 1}}>
                    <IconSelectField
                      label={t('home.pickupCity')}
                      value={shpPickupCity}
                      iconName="map-marker-outline"
                      onPress={() =>
                        openPicker(
                          t('common.selectCity'),
                          OMAN_CITIES,
                          (v, _l) => {
                            setShpPickupCity(v);
                            closePicker();
                          },
                        )
                      }
                    />
                  </View>
                </View>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <View style={{flex: 1}}>
                    <View style={{marginBottom: 14}}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          marginBottom: 6,
                        }}>
                        {t('home.dropoffCountry')}
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1.5,
                          borderColor: '#E2E8F0',
                          borderRadius: 12,
                          height: 48,
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          gap: 6,
                        }}>
                        <Text style={{fontSize: 16}}>🇴🇲</Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textPrimary,
                            fontWeight: '500',
                          }}>
                          {i18n.language === 'ar' ? 'عُمان' : 'Oman'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{flex: 1}}>
                    <IconSelectField
                      label={t('home.dropoffCity')}
                      value={shpDropoffCity}
                      iconName="map-marker-outline"
                      onPress={() =>
                        openPicker(
                          t('common.selectCity'),
                          OMAN_CITIES,
                          (v, _l) => {
                            setShpDropoffCity(v);
                            closePicker();
                          },
                        )
                      }
                    />
                  </View>
                </View>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <DatePickerInput
                    label={t('home.dateFrom')}
                    value={shpDateFrom}
                    onChange={setShpDateFrom}
                    minimumDate={new Date()}
                    flex={1}
                  />
                  <DatePickerInput
                    label={t('home.dateTo')}
                    value={shpDateTo}
                    onChange={setShpDateTo}
                    minimumDate={shpDateFrom ?? new Date()}
                    flex={1}
                  />
                </View>
              </>
            )}

            {/* ELECTRICAL / CIVIL — coming soon */}
            {isComingSoon && (
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: 28,
                  paddingHorizontal: 16,
                  gap: 8,
                }}>
                <Icon name="clock-outline" size={36} color="#94A3B8" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#475569',
                    textAlign: 'center',
                    marginTop: 4,
                  }}>
                  {t('home.comingSoon', {defaultValue: 'Coming Soon'})}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#94A3B8',
                    textAlign: 'center',
                    lineHeight: 18,
                  }}>
                  {t('home.comingSoonDesc', {
                    defaultValue:
                      'This category will be available soon.',
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* SEARCH BUTTON — orange CTA, hidden for coming-soon categories */}
          {!isComingSoon && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSearch}
              style={{
                marginTop: 14,
                borderRadius: 14,
                height: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#E67E3A',
                shadowColor: '#E67E3A',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}>
              <Icon name="magnify" size={20} color="#ffffff" />
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '600',
                  letterSpacing: 0.2,
                }}>
                {i18n.language === 'ar'
                  ? 'بحث عن موردين في عُمان'
                  : 'Search Oman Suppliers'}
              </Text>
            </TouchableOpacity>
          )}

          {/* RECENT SEARCHES */}
          {recentSearches.length > 0 && (
            <View style={{marginTop: 20, marginBottom: 32}}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 10,
                }}>
                <Icon name="history" size={14} color={colors.textSecondary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.textSecondary,
                  }}>
                  {t('home.recentSearches')}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection: 'row', gap: 8}}>
                  {recentSearches.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1.5,
                        borderColor: '#E2E8F0',
                        borderRadius: 24,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      activeOpacity={0.7}
                      onPress={() => applyRecentSearch(item)}>
                      <Icon
                        name="clock-outline"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={{fontSize: 12, color: colors.textPrimary}}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* PICKER MODAL */}
      <Modal
        visible={picker.visible}
        transparent
        animationType="slide"
        onRequestClose={closePicker}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(16,24,40,0.6)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={closePicker}>
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 32,
            }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#E2E8F0',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: 12,
              }}>
              {picker.title}
            </Text>
            <FlatList
              data={picker.options}
              keyExtractor={item => item.value}
              style={{maxHeight: 340}}
              ItemSeparatorComponent={() => (
                <View style={{height: 1, backgroundColor: '#E2E8F0'}} />
              )}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={{paddingVertical: 14, paddingHorizontal: 8}}
                  activeOpacity={0.7}
                  onPress={() => picker.onSelect(item.value, item.label)}>
                  <Text style={{fontSize: 14, color: colors.textPrimary}}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* DEMO TOOLTIPS */}
      <DemoTooltip
        visible={isActive && currentStep === 'home'}
        stepNumber={1}
        totalSteps={18}
        title={tDemo('tour.home.title')}
        description={tDemo('tour.home.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'select_category'}
        stepNumber={2}
        totalSteps={18}
        title={tDemo('tour.select_category.title')}
        description={tDemo('tour.select_category.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'select_location'}
        stepNumber={3}
        totalSteps={18}
        title={tDemo('tour.select_location.title')}
        description={tDemo('tour.select_location.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'tap_search'}
        stepNumber={4}
        totalSteps={18}
        title={tDemo('tour.tap_search.title')}
        description={tDemo('tour.tap_search.description')}
        onNext={() => {
          nextStep();
          navigation.navigate('SearchResults', {
            category: 'machinery',
            params: {country: 'Oman', city: 'Muscat'},
          });
        }}
      />

      <DemoFloatingBar />
    </View>
  );
}
