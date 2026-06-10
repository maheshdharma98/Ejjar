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
import DatePickerInput from '../components/common/DatePickerInput';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import Icon from '../components/common/Icon';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useAppStore} from '../store/appStore';
import LanguageToggle from '../components/common/LanguageToggle';
import {colors, shadows} from '../theme/designSystem';
import {categoryColors, categoryBgColors} from '../utils/iconMap';
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

const OMAN_CITIES: Option[] = ['Muscat', 'Sohar', 'Salalah', 'Nizwa', 'Sur', 'Duqm', 'Ibri', 'Rustaq'].map(c => ({label: c, value: c}));
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

// ---------------------------------------------------------------------------
// Field sub-components
// ---------------------------------------------------------------------------

function FieldLabel({label}: {label: string}) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 6,
      }}
    >
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
  return (
    <View style={{marginBottom: 16}}>
      <FieldLabel label={label} />
      <TouchableOpacity
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
        }}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <Icon name={iconName} size={20} color={colors.textSecondary} />
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            color: value ? colors.textPrimary : colors.muted,
            marginLeft: 10,
          }}
          numberOfLines={1}
        >
          {value || label}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.textSecondary} />
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
  return (
    <View style={{marginBottom: 16}}>
      <FieldLabel label={label} />
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
        }}
      >
        <Icon name={iconName} size={20} color={colors.textSecondary} />
        <TextInput
          style={{flex: 1, fontSize: 15, color: colors.textPrimary, marginLeft: 10}}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? ''}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

function ToggleSwitch({value, onToggle}: {value: boolean; onToggle: () => void}) {
  return (
    <TouchableOpacity
      style={{
        width: 51,
        height: 31,
        borderRadius: 16,
        justifyContent: 'center',
        paddingHorizontal: 2,
        backgroundColor: value ? colors.primary : colors.border,
      }}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View
        style={{
          width: 27,
          height: 27,
          borderRadius: 14,
          backgroundColor: colors.card,
          alignSelf: value ? 'flex-end' : 'flex-start',
          ...shadows.sm,
        }}
      />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Category card
// ---------------------------------------------------------------------------

const CARD_DEFS: {
  key: Category;
  iconName: string;
  labelKey: string;
  subLabelKey: string;
}[] = [
  {key: 'manpower', iconName: 'hard-hat', labelKey: 'home.manpower', subLabelKey: 'home.manpowerSubtitle'},
  {key: 'machinery', iconName: 'crane', labelKey: 'home.machinery', subLabelKey: 'home.machinerySubtitle'},
  {key: 'shipping', iconName: 'package-variant', labelKey: 'home.shipping', subLabelKey: 'home.shippingSubtitle'},
];

function CategoryCard({
  card,
  isActive,
  onPress,
  label,
  subLabel,
}: {
  card: typeof CARD_DEFS[0];
  isActive: boolean;
  onPress: () => void;
  label: string;
  subLabel: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {toValue: 0.97, useNativeDriver: true, speed: 200, bounciness: 0}).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 80, bounciness: 6}).start();
  };

  const accent = categoryColors[card.key] ?? colors.primary;
  const bg = categoryBgColors[card.key] ?? colors.primaryLight;

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          {
            width: 120,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            alignItems: 'flex-start',
            borderWidth: isActive ? 2 : 0,
            borderColor: isActive ? colors.primary : 'transparent',
          },
          shadows.md,
        ]}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={card.iconName} size={28} color={accent} />
        </View>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: isActive ? accent : colors.textPrimary,
            marginTop: 10,
          }}
        >
          {label}
        </Text>
        <Text style={{fontSize: 11, color: colors.textSecondary, marginTop: 2}}>
          {subLabel}
        </Text>
      </TouchableOpacity>
    </Animated.View>
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
    let params: Record<string, unknown> = {};
    let label = '';
    let city = '';
    let country = '';

    if (activeCategory === 'manpower') {
      params = {role: mpRole, quantity: mpQty, country: mpCountry, city: mpCity, dateFrom: mpDateFrom?.toISOString() ?? '', dateTo: mpDateTo?.toISOString() ?? '', skillLevel: mpSkill};
      label = mpRoleLabel || t('home.manpower');
      city = mpCity;
      country = mpCountry;
    } else if (activeCategory === 'machinery') {
      params = {type: mchType, quantity: mchQty, needsOperator: mchOperator, duration: mchDuration, country: mchCountry, city: mchCity};
      label = mchTypeLabel || t('home.machinery');
      city = mchCity;
      country = mchCountry;
    } else {
      params = {packageType: shpType, weight: shpWeight, fragile: shpFragile, hazmat: shpHazmat, coldChain: shpColdChain, pickupCountry: shpPickupCountry, pickupCity: shpPickupCity, dropoffCountry: shpDropoffCountry, dropoffCity: shpDropoffCity, dateFrom: shpDateFrom?.toISOString() ?? '', dateTo: shpDateTo?.toISOString() ?? ''};
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
      if (p.city) setMpCity(p.city as string);
    } else if (item.category === 'machinery') {
      if (p.type) {setMchType(p.type as string); setMchTypeLabel(item.label);}
      if (p.city) setMchCity(p.city as string);
    } else {
      if (p.packageType) {setShpType(p.packageType as string); setShpTypeLabel(item.label);}
      if (p.pickupCity) setShpPickupCity(p.pickupCity as string);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <ScrollView bounces showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: insets.bottom + 96}}>

        {/* GRADIENT HEADER */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={{paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 28}}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <EjjarLogo variant="white" width={100} height={44} />
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <LanguageToggle />
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.8}
                style={{position: 'relative'}}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              >
                <Icon name="bell-outline" size={24} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: colors.error,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{color: '#FFFFFF', fontSize: 9, fontWeight: '700'}}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={{color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 16}}>
            {t('home.title')}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4}}>
            <Icon name="map-marker" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 13}}>{t('home.subtitle')}</Text>
          </View>
        </LinearGradient>

        {/* CATEGORY CARDS — overlap header by 20 */}
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
                onPress={() => {
                  setActiveCategory(card.key);
                  navigation.navigate('SubcategoryGrid', {categoryId: card.key});
                }}
                label={t(card.labelKey)}
                subLabel={t(card.subLabelKey)}
              />
            ))}
          </ScrollView>
        </View>

        {/* DEMO TOUR BUTTON */}
        {!isActive && (
          <TouchableOpacity
            onPress={startDemo}
            activeOpacity={0.85}
            style={{
              marginHorizontal: 16,
              marginBottom: 12,
              backgroundColor: colors.primary,
              borderRadius: 16,
              shadowColor: colors.primary,
              shadowOffset: {width: 0, height: 6},
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View style={{flexDirection: 'row', alignItems: 'center', padding: 16}}>
              <View style={{width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, alignItems: 'center', justifyContent: 'center'}}>
                <Icon name="play-circle" size={28} color="white" />
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={{color: '#fff', fontWeight: '700', fontSize: 15}}>
                  {i18n.language === 'ar' ? 'جولة تعريفية بإيجار' : 'Watch Demo Tour'}
                </Text>
                <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2}}>
                  {i18n.language === 'ar' ? 'شاهد كيف تعمل إيجار في دقيقتين' : 'See how EJJAR works in 2 minutes'}
                </Text>
              </View>
              <Icon name="arrow-right-circle" size={28} color="white" />
            </View>
          </TouchableOpacity>
        )}

        {/* FORM SECTION */}
        <View style={{paddingHorizontal: 16, paddingTop: 16}}>

          {/* Tab pills */}
          <View style={{flexDirection: 'row', gap: 8, marginBottom: 16}}>
            {CARD_DEFS.map(card => {
              const isActive = activeCategory === card.key;
              return (
                <TouchableOpacity
                  key={card.key}
                  onPress={() => setActiveCategory(card.key)}
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: colors.border,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    {t(card.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form card */}
          <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16}, shadows.sm]}>

            {/* MANPOWER */}
            {activeCategory === 'manpower' && (
              <>
                <IconSelectField
                  label={t('home.role')}
                  value={mpRoleLabel}
                  iconName="account-tie"
                  onPress={() =>
                    openPicker(t('home.role'), MP_ROLES, (v, l) => {
                      setMpRole(v); setMpRoleLabel(l); closePicker();
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
                <View style={{flexDirection: 'row', gap: 12}}>
                  <View style={{flex: 1}}>
                    <View style={{marginBottom: 16}}>
                      <Text style={{fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6}}>
                        {t('home.country')}
                      </Text>
                      <View style={{backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6}}>
                        <Text style={{fontSize: 18}}>🇴🇲</Text>
                        <Text style={{fontSize: 14, color: colors.textPrimary, fontWeight: '600'}}>
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
                        openPicker(t('common.selectCity'), OMAN_CITIES, (v, _l) => {
                          setMpCity(v); closePicker();
                        })
                      }
                    />
                  </View>
                </View>
                <View style={{flexDirection: 'row', gap: 12}}>
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
                      setMpSkill(v); setMpSkillLabel(l); closePicker();
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
                      setMchType(v); setMchTypeLabel(l); closePicker();
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
                    marginBottom: 16,
                  }}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Icon name="account-hard-hat" size={20} color={colors.textSecondary} />
                    <Text style={{fontSize: 14, color: colors.textPrimary, fontWeight: '500'}}>
                      {t('home.operatorNeeded')}
                    </Text>
                  </View>
                  <ToggleSwitch value={mchOperator} onToggle={() => setMchOperator(v => !v)} />
                </View>
                <IconSelectField
                  label={t('home.duration')}
                  value={mchDurationLabel}
                  iconName="clock-outline"
                  onPress={() =>
                    openPicker(t('home.duration'), DURATIONS, (v, l) => {
                      setMchDuration(v); setMchDurationLabel(l); closePicker();
                    })
                  }
                />
                <View style={{flexDirection: 'row', gap: 12}}>
                  <View style={{flex: 1}}>
                    <View style={{marginBottom: 16}}>
                      <Text style={{fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6}}>
                        {t('home.country')}
                      </Text>
                      <View style={{backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6}}>
                        <Text style={{fontSize: 18}}>🇴🇲</Text>
                        <Text style={{fontSize: 14, color: colors.textPrimary, fontWeight: '600'}}>
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
                        openPicker(t('common.selectCity'), OMAN_CITIES, (v, _l) => {
                          setMchCity(v); closePicker();
                        })
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
                      setShpType(v); setShpTypeLabel(l); closePicker();
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
                <View style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20}}>
                  {[
                    {label: t('home.fragile'), val: shpFragile, fn: () => setShpFragile(v => !v)},
                    {label: t('home.hazmat'), val: shpHazmat, fn: () => setShpHazmat(v => !v)},
                    {label: t('home.coldChain'), val: shpColdChain, fn: () => setShpColdChain(v => !v)},
                  ].map(toggle => (
                    <View key={toggle.label} style={{alignItems: 'center', gap: 6}}>
                      <Text style={{fontSize: 11, color: colors.textPrimary, fontWeight: '500', textAlign: 'center'}}>
                        {toggle.label}
                      </Text>
                      <ToggleSwitch value={toggle.val} onToggle={toggle.fn} />
                    </View>
                  ))}
                </View>
                <View style={{flexDirection: 'row', gap: 12}}>
                  <View style={{flex: 1}}>
                    <View style={{marginBottom: 16}}>
                      <Text style={{fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6}}>
                        {t('home.pickupCountry')}
                      </Text>
                      <View style={{backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6}}>
                        <Text style={{fontSize: 18}}>🇴🇲</Text>
                        <Text style={{fontSize: 14, color: colors.textPrimary, fontWeight: '600'}}>
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
                        openPicker(t('common.selectCity'), OMAN_CITIES, (v, _l) => {
                          setShpPickupCity(v); closePicker();
                        })
                      }
                    />
                  </View>
                </View>
                <View style={{flexDirection: 'row', gap: 12}}>
                  <View style={{flex: 1}}>
                    <View style={{marginBottom: 16}}>
                      <Text style={{fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6}}>
                        {t('home.dropoffCountry')}
                      </Text>
                      <View style={{backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6}}>
                        <Text style={{fontSize: 18}}>🇴🇲</Text>
                        <Text style={{fontSize: 14, color: colors.textPrimary, fontWeight: '600'}}>
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
                        openPicker(t('common.selectCity'), OMAN_CITIES, (v, _l) => {
                          setShpDropoffCity(v); closePicker();
                        })
                      }
                    />
                  </View>
                </View>
                <View style={{flexDirection: 'row', gap: 12}}>
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
          </View>

          {/* SEARCH BUTTON */}
          <TouchableOpacity
            style={[
              {
                backgroundColor: colors.primary,
                borderRadius: 16,
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
                gap: 8,
              },
              shadows.primary,
            ]}
            activeOpacity={0.85}
            onPress={handleSearch}
          >
            <Icon name="magnify" size={22} color="#FFFFFF" />
            <Text style={{color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3}}>
              {i18n.language === 'ar' ? 'بحث عن موردين في عُمان' : 'Search Oman Suppliers'}
            </Text>
          </TouchableOpacity>

          {/* RECENT SEARCHES */}
          {recentSearches.length > 0 && (
            <View style={{marginTop: 20, marginBottom: 32}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10}}>
                <Icon name="history" size={16} color={colors.textSecondary} />
                <Text style={{fontSize: 13, fontWeight: '600', color: colors.textSecondary}}>
                  {t('home.recentSearches')}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection: 'row', gap: 8}}>
                  {recentSearches.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      activeOpacity={0.7}
                      onPress={() => applyRecentSearch(item)}
                    >
                      <Icon name="clock-outline" size={13} color={colors.textSecondary} />
                      <Text style={{fontSize: 12, color: colors.textPrimary}}>{item.label}</Text>
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
        onRequestClose={closePicker}
      >
        <TouchableOpacity
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}
          activeOpacity={1}
          onPress={closePicker}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 32,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />
            <Text style={{fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12}}>
              {picker.title}
            </Text>
            <FlatList
              data={picker.options}
              keyExtractor={item => item.value}
              style={{maxHeight: 340}}
              ItemSeparatorComponent={() => <View style={{height: 1, backgroundColor: colors.background}} />}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={{paddingVertical: 16, paddingHorizontal: 8}}
                  activeOpacity={0.7}
                  onPress={() => picker.onSelect(item.value, item.label)}
                >
                  <Text style={{fontSize: 16, color: colors.textPrimary}}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* DEMO TOOLTIPS */}
      <DemoTooltip
        visible={isActive && currentStep === 'home'}
        stepNumber={1} totalSteps={18}
        title={tDemo('tour.home.title')}
        description={tDemo('tour.home.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'select_category'}
        stepNumber={2} totalSteps={18}
        title={tDemo('tour.select_category.title')}
        description={tDemo('tour.select_category.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'select_location'}
        stepNumber={3} totalSteps={18}
        title={tDemo('tour.select_location.title')}
        description={tDemo('tour.select_location.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'tap_search'}
        stepNumber={4} totalSteps={18}
        title={tDemo('tour.tap_search.title')}
        description={tDemo('tour.tap_search.description')}
        onNext={() => {
          nextStep();
          navigation.navigate('SearchResults', {category: 'machinery', params: {country: 'Oman', city: 'Muscat'}});
        }}
      />

      <DemoFloatingBar />
    </View>
  );
}
