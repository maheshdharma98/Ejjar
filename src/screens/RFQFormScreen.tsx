import React, {useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from '../components/common/Icon';
import DatePickerInput from '../components/common/DatePickerInput';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useDemoData} from '../store/demoDataStore';
import type {Category, Subcategory} from '../../../shared/types/demo';
import {useDemoStore} from '../store/demoStore';
import DemoTooltip from '../components/common/DemoTooltip';
import DemoFloatingBar from '../components/common/DemoFloatingBar';
import {colors, shadows} from '../theme/designSystem';
import SectionHeader from '../components/common/SectionHeader';
import PremiumButton from '../components/common/PremiumButton';

const TAX = require('../../../shared/mock/taxonomy.json') as {
  manpower: {slug: string; label_en: string}[];
  machinery: {slug: string; label_en: string}[];
  vehicles: {slug: string; label_en: string}[];
  shipping: {slug: string; label_en: string}[];
};

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RFQForm'>;

interface Option {label: string; value: string}
interface PickerState {
  visible: boolean;
  title: string;
  options: Option[];
  onSelect: (v: string, l: string) => void;
}

const OMAN_CITIES: Option[] = ['Muscat', 'Sohar', 'Salalah', 'Nizwa', 'Sur', 'Duqm', 'Ibri', 'Rustaq'].map(c => ({label: c, value: c}));
const MP_ROLES = TAX.manpower.map(r => ({label: r.label_en, value: r.slug}));
const MCH_TYPES = TAX.machinery.map(m => ({label: m.label_en, value: m.slug}));
const VEH_TYPES = TAX.vehicles.map(v => ({label: v.label_en, value: v.slug}));
const SHP_TYPES = TAX.shipping.map(s => ({label: s.label_en, value: s.slug}));
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
const SEATING: Option[] = [
  {label: '4', value: '4'},
  {label: '8', value: '8'},
  {label: '14', value: '14'},
  {label: '30', value: '30'},
  {label: '50+', value: '50+'},
];

// ---------------------------------------------------------------------------
// Shared field sub-components
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
    <View style={{marginBottom: 14}}>
      <FieldLabel label={label} />
      <TouchableOpacity
        style={{
          backgroundColor: colors.background,
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
          style={{flex: 1, fontSize: 15, color: value ? colors.textPrimary : colors.muted, marginLeft: 10}}
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
    <View style={{marginBottom: 14}}>
      <FieldLabel label={label} />
      <View
        style={{
          backgroundColor: colors.background,
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

function Toggle({value, onToggle}: {value: boolean; onToggle: () => void}) {
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

function ErrorText({msg}: {msg: string}) {
  if (!msg) return null;
  return (
    <Text style={{color: colors.error, fontSize: 11, marginTop: 4, paddingStart: 4}}>
      {msg}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function RFQFormScreen() {
  const {t, i18n} = useTranslation();
  const {t: tDemo} = useTranslation('demo');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {isActive, currentStep, nextStep} = useDemoStore();

  const {category, params} = route.params;
  const initCountry = (params?.country as string) ?? '';
  const initCity = (params?.city as string) ?? '';
  const subcategoryId = ((params?.subcategoryId as string) ?? (params?.subcategory as string) ?? '') as Subcategory | '';
  const isDemoRFQMode = !!subcategoryId;

  const {createRFQ, currentUserId, getSuppliersBySubcategory, getSuppliersByCategory} = useDemoData();

  const initDescription = isDemoRFQMode
    ? `${t(`demo:subcategories.${subcategoryId}`)} — ${t('rfq.description')}`
    : '';
  const initCountryFinal = 'Oman';
  const initCityFinal = isDemoRFQMode ? 'Muscat' : (initCity || '');

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [description, setDescription] = useState(initDescription);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [country] = useState(initCountryFinal);
  const [city, setCity] = useState(initCityFinal);
  const [fileName, setFileName] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Manpower
  const [mpRole, setMpRole] = useState('');
  const [mpRoleLabel, setMpRoleLabel] = useState('');
  const [mpQty, setMpQty] = useState('');
  const [mpSkill, setMpSkill] = useState('');
  const [mpSkillLabel, setMpSkillLabel] = useState('');
  const [mpSecondary, setMpSecondary] = useState<string[]>([]);

  // Machinery
  const [mchType, setMchType] = useState('');
  const [mchTypeLabel, setMchTypeLabel] = useState('');
  const [mchQty, setMchQty] = useState('');
  const [mchOperator, setMchOperator] = useState(false);
  const [mchDuration, setMchDuration] = useState('');
  const [mchDurationLabel, setMchDurationLabel] = useState('');
  const [mchCapacity, setMchCapacity] = useState('');

  // Vehicle
  const [vehType, setVehType] = useState('');
  const [vehTypeLabel, setVehTypeLabel] = useState('');
  const [vehDriver, setVehDriver] = useState(false);
  const [vehPeriod, setVehPeriod] = useState('');
  const [vehKm, setVehKm] = useState('');
  const [vehSeating, setVehSeating] = useState('');
  const [vehSeatingLabel, setVehSeatingLabel] = useState('');

  // Shipping
  const [shpType, setShpType] = useState('');
  const [shpTypeLabel, setShpTypeLabel] = useState('');
  const [shpWeight, setShpWeight] = useState('');
  const [shpFragile, setShpFragile] = useState(false);
  const [shpHazmat, setShpHazmat] = useState(false);
  const [shpColdChain, setShpColdChain] = useState(false);
  const [shpPickupCountry] = useState('Oman');
  const [shpPickupCity, setShpPickupCity] = useState(initCity || '');
  const [shpDropoffCountry] = useState('Oman');
  const [shpDropoffCity, setShpDropoffCity] = useState('');

  const [picker, setPicker] = useState<PickerState>({visible: false, title: '', options: [], onSelect: () => {}});
  const openPicker = (title: string, options: Option[], onSelect: (v: string, l: string) => void) =>
    setPicker({visible: true, title, options, onSelect});
  const closePicker = () => setPicker(p => ({...p, visible: false}));

  const toggleSecondary = (slug: string) => {
    setMpSecondary(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug],
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = t('common.required');
    if (!dateFrom) e.dateFrom = t('common.required');
    if (!dateTo) e.dateTo = t('common.required');
    if (!signed) e.signed = t('common.required');
    if (!termsAccepted) e.terms = t('common.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (isActive) { nextStep(); return; }
    if (!validate()) return;

    setIsBroadcasting(true);
    setTimeout(() => {
      const matchedSuppliers = subcategoryId
        ? getSuppliersBySubcategory(subcategoryId)
        : getSuppliersByCategory(category as Category);
      const title = mpRoleLabel || mchTypeLabel || vehTypeLabel || shpTypeLabel || category;
      const newRFQ = createRFQ({
        contractorId: currentUserId,
        category: category as Category,
        subcategory: (subcategoryId || category) as Subcategory,
        title: `${title} request`,
        titleAr: `طلب ${title}`,
        description: description.trim() || `${title} services needed`,
        descriptionAr: description.trim() || `خدمات ${title} مطلوبة`,
        city: city || 'Muscat',
        cityAr: city || 'مسقط',
        budget: {min: 0, max: 1000, currency: 'OMR'},
        startDate: dateFrom ? dateFrom.toISOString() : new Date().toISOString(),
        duration: 'daily',
        durationAr: 'يومي',
        status: 'broadcasted',
        broadcastedTo: matchedSuppliers.map(s => s.id),
      });
      setIsBroadcasting(false);
      navigation.navigate('RFQBroadcast', {
        rfqId: newRFQ.id,
        supplierCount: matchedSuppliers.length,
        city: city || 'Muscat',
      });
    }, 2200);
  };

  // suppress unused variable warnings
  void mpRole; void mpSkill; void mchType; void mchDuration; void vehType; void vehDriver;
  void vehPeriod; void vehKm; void vehSeating; void shpType;
  void shpPickupCountry; void shpDropoffCountry; void country;

  return (
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View
          style={{
            backgroundColor: '#101828',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: insets.top + 12,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{marginRight: 12, padding: 4}}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <View style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>
              <Icon name="arrow-left" size={24} color="#E67E3A" />
            </View>
          </TouchableOpacity>
          <Text style={{fontSize: 17, fontWeight: '600', color: '#FFFFFF', flex: 1}}>
            {t('rfq.title')}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="close" size={22} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>

          {/* BROADCAST NOTICE */}
          <View
            style={{
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              borderRadius: 16,
              padding: 16,
              marginHorizontal: 16,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <Icon name="bullhorn-outline" size={28} color={colors.primary} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={{fontSize: 13, fontWeight: '600', color: colors.primary}}>
                Your RFQ broadcasts to all matching suppliers
              </Text>
              <Text style={{fontSize: 12, color: '#475569', marginTop: 3}}>
                in your selected region
              </Text>
            </View>
          </View>

          {/* SECTION 1: Project Details */}
          <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12}, shadows.sm]}>
            <SectionHeader title="Project Details" iconName="file-document-outline" />

            <View style={{marginBottom: 14}}>
              <FieldLabel label={t('rfq.description')} />
              <View
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <TextInput
                  style={{fontSize: 15, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top'}}
                  value={description}
                  onChangeText={v => {setDescription(v); setErrors(e => ({...e, description: ''}));}}
                  multiline
                  numberOfLines={4}
                  placeholder={t('rfq.description')}
                  placeholderTextColor={colors.muted}
                />
              </View>
              <ErrorText msg={errors.description ?? ''} />
            </View>

            {/* Manpower details */}
            {category === 'manpower' && (
              <>
                <IconTextInput
                  label={t('home.quantity')}
                  value={mpQty}
                  onChange={setMpQty}
                  iconName="counter"
                  placeholder="1"
                  keyboardType="number-pad"
                />
                <IconSelectField
                  label={t('home.role')}
                  value={mpRoleLabel}
                  iconName="account-tie"
                  onPress={() =>
                    openPicker(t('home.role'), MP_ROLES, (v, l) => {setMpRole(v); setMpRoleLabel(l); closePicker();})
                  }
                />
                <IconSelectField
                  label={t('home.skillLevel')}
                  value={mpSkillLabel}
                  iconName="school-outline"
                  onPress={() =>
                    openPicker(t('home.skillLevel'), SKILL_LEVELS, (v, l) => {setMpSkill(v); setMpSkillLabel(l); closePicker();})
                  }
                />
                <Text style={{fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8}}>
                  Secondary Skills
                </Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
                  {MP_ROLES.map(r => {
                    const sel = mpSecondary.includes(r.value);
                    return (
                      <TouchableOpacity
                        key={r.value}
                        onPress={() => toggleSecondary(r.value)}
                        style={{
                          borderRadius: 20,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: sel ? colors.primary : colors.background,
                          borderWidth: 1,
                          borderColor: sel ? colors.primary : colors.border,
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{fontSize: 12, fontWeight: '500', color: sel ? '#FFFFFF' : colors.textSecondary}}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Machinery details */}
            {category === 'machinery' && (
              <>
                <IconSelectField
                  label={t('home.machinery')}
                  value={mchTypeLabel}
                  iconName="crane"
                  onPress={() =>
                    openPicker(t('home.machinery'), MCH_TYPES, (v, l) => {setMchType(v); setMchTypeLabel(l); closePicker();})
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
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Icon name="account-hard-hat" size={20} color={colors.textSecondary} />
                    <Text style={{fontSize: 14, color: colors.textPrimary, fontWeight: '500'}}>
                      {t('home.operatorNeeded')}
                    </Text>
                  </View>
                  <Toggle value={mchOperator} onToggle={() => setMchOperator(v => !v)} />
                </View>
                <IconSelectField
                  label={t('home.duration')}
                  value={mchDurationLabel}
                  iconName="clock-outline"
                  onPress={() =>
                    openPicker(t('home.duration'), DURATIONS, (v, l) => {setMchDuration(v); setMchDurationLabel(l); closePicker();})
                  }
                />
                <IconTextInput
                  label="Capacity"
                  value={mchCapacity}
                  onChange={setMchCapacity}
                  iconName="weight-kilogram"
                  placeholder="e.g. 20 tonnes"
                />
              </>
            )}

            {/* Vehicle details */}
            {category === 'vehicles' && (
              <>
                <IconSelectField
                  label="Vehicle Type"
                  value={vehTypeLabel}
                  iconName="truck"
                  onPress={() =>
                    openPicker('Vehicle Type', VEH_TYPES, (v, l) => {setVehType(v); setVehTypeLabel(l); closePicker();})
                  }
                />
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Icon name="steering" size={20} color={colors.textSecondary} />
                    <Text style={{fontSize: 14, color: colors.textPrimary, fontWeight: '500'}}>
                      {t('home.driverNeeded')}
                    </Text>
                  </View>
                  <Toggle value={vehDriver} onToggle={() => setVehDriver(v => !v)} />
                </View>
                <IconTextInput
                  label="Rental Period"
                  value={vehPeriod}
                  onChange={setVehPeriod}
                  iconName="calendar-range"
                  placeholder="e.g. 30 days"
                />
                <IconTextInput
                  label="KM Limit"
                  value={vehKm}
                  onChange={setVehKm}
                  iconName="speedometer"
                  placeholder="Unlimited"
                  keyboardType="number-pad"
                />
                <IconSelectField
                  label="Seating Capacity"
                  value={vehSeatingLabel}
                  iconName="seat-passenger"
                  onPress={() =>
                    openPicker('Seating Capacity', SEATING, (v, l) => {setVehSeating(v); setVehSeatingLabel(l); closePicker();})
                  }
                />
              </>
            )}

            {/* Shipping details */}
            {category === 'shipping' && (
              <>
                <IconSelectField
                  label={t('home.packageType')}
                  value={shpTypeLabel}
                  iconName="package-variant-closed"
                  onPress={() =>
                    openPicker(t('home.packageType'), SHP_TYPES, (v, l) => {setShpType(v); setShpTypeLabel(l); closePicker();})
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
                <View style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14}}>
                  {[
                    {label: t('home.fragile'), val: shpFragile, fn: () => setShpFragile(v => !v)},
                    {label: t('home.hazmat'), val: shpHazmat, fn: () => setShpHazmat(v => !v)},
                    {label: t('home.coldChain'), val: shpColdChain, fn: () => setShpColdChain(v => !v)},
                  ].map(tog => (
                    <View key={tog.label} style={{alignItems: 'center', gap: 6}}>
                      <Text style={{fontSize: 11, color: colors.textPrimary, fontWeight: '500', textAlign: 'center'}}>
                        {tog.label}
                      </Text>
                      <Toggle value={tog.val} onToggle={tog.fn} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* SECTION 2: Timeline */}
          <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12}, shadows.sm]}>
            <SectionHeader title="Timeline" iconName="calendar-clock" />
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={{flex: 1}}>
                <DatePickerInput
                  label={t('rfq.dateFrom')}
                  value={dateFrom}
                  onChange={d => {setDateFrom(d); setErrors(e => ({...e, dateFrom: ''}));}}
                  minimumDate={new Date()}
                />
                <ErrorText msg={errors.dateFrom ?? ''} />
              </View>
              <View style={{flex: 1}}>
                <DatePickerInput
                  label={t('rfq.dateTo')}
                  value={dateTo}
                  onChange={d => {setDateTo(d); setErrors(e => ({...e, dateTo: ''}));}}
                  minimumDate={dateFrom ?? new Date()}
                />
                <ErrorText msg={errors.dateTo ?? ''} />
              </View>
            </View>
          </View>

          {/* SECTION 3: Location */}
          <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12}, shadows.sm]}>
            <SectionHeader title="Location" iconName="map-marker-outline" />
            {category === 'shipping' ? (
              <>
                {/* Pickup */}
                <View style={{marginBottom: 6}}>
                  <FieldLabel label={i18n.language === 'ar' ? 'بلد الاستلام' : 'Pickup Country'} />
                  <View style={{
                    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                    paddingHorizontal: 12, paddingVertical: 13,
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: colors.background, marginBottom: 8,
                  }}>
                    <Text style={{fontSize: 20}}>🇴🇲</Text>
                    <Text style={{fontSize: 15, color: colors.textPrimary, fontWeight: '600'}}>
                      {i18n.language === 'ar' ? 'عُمان' : 'Oman'}
                    </Text>
                  </View>
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
                {/* Dropoff */}
                <View style={{marginBottom: 6}}>
                  <FieldLabel label={i18n.language === 'ar' ? 'بلد التسليم' : 'Dropoff Country'} />
                  <View style={{
                    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                    paddingHorizontal: 12, paddingVertical: 13,
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: colors.background, marginBottom: 8,
                  }}>
                    <Text style={{fontSize: 20}}>🇴🇲</Text>
                    <Text style={{fontSize: 15, color: colors.textPrimary, fontWeight: '600'}}>
                      {i18n.language === 'ar' ? 'عُمان' : 'Oman'}
                    </Text>
                  </View>
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
              </>
            ) : (
              <>
                <View style={{marginBottom: 14}}>
                  <FieldLabel label={t('home.country')} />
                  <View style={{
                    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                    paddingHorizontal: 12, paddingVertical: 13,
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: colors.background,
                  }}>
                    <Text style={{fontSize: 20}}>🇴🇲</Text>
                    <Text style={{fontSize: 15, color: colors.textPrimary, fontWeight: '600'}}>
                      {i18n.language === 'ar' ? 'عُمان' : 'Oman'}
                    </Text>
                    <Text style={{fontSize: 12, color: colors.muted, marginStart: 4}}>
                      {i18n.language === 'ar' ? '(البلد الوحيد المتاح)' : '(Only available country)'}
                    </Text>
                  </View>
                </View>
                <IconSelectField
                  label={t('home.city')}
                  value={city}
                  iconName="map-marker-outline"
                  onPress={() =>
                    openPicker(t('common.selectCity'), OMAN_CITIES, (v, _l) => {
                      setCity(v); closePicker();
                    })
                  }
                />
              </>
            )}
          </View>

          {/* SECTION 4: Attachments */}
          <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12}, shadows.sm]}>
            <SectionHeader title="Attachments" iconName="paperclip" />
            <TouchableOpacity
              style={{
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: colors.border,
                borderRadius: 12,
                height: 100,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              activeOpacity={0.7}
              onPress={() => setFileName('requirements.pdf')}
            >
              <Icon name="cloud-upload-outline" size={32} color={colors.muted} />
              <Text style={{fontSize: 13, color: colors.textSecondary}}>{t('rfq.attachFile')}</Text>
            </TouchableOpacity>
            {fileName && (
              <View style={{flexDirection: 'row', marginTop: 10, flexWrap: 'wrap'}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.primaryLight,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    gap: 6,
                  }}
                >
                  <Icon name="file-document-outline" size={14} color={colors.primary} />
                  <Text style={{fontSize: 12, color: colors.primary}}>{fileName}</Text>
                  <TouchableOpacity
                    onPress={() => setFileName(null)}
                    hitSlop={{top: 4, bottom: 4, left: 4, right: 4}}
                  >
                    <Icon name="close" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* SECTION 5: Signature */}
          <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12}, shadows.sm]}>
            <SectionHeader title="Signature" iconName="signature-freehand" />
            <TouchableOpacity
              onPress={() => {setSigned(true); setErrors(e => ({...e, signed: ''}));}}
              activeOpacity={0.8}
              style={{
                height: 100,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 2,
                borderStyle: signed ? 'solid' : 'dashed',
                borderColor: signed ? colors.success : colors.border,
                backgroundColor: signed ? colors.successLight : 'transparent',
              }}
            >
              {signed ? (
                <>
                  <Icon name="check-decagram" size={32} color={colors.success} />
                  <Text style={{fontSize: 13, fontWeight: '600', color: colors.success}}>{t('rfq.signed')}</Text>
                </>
              ) : (
                <>
                  <Icon name="draw" size={32} color={colors.muted} />
                  <Text style={{fontSize: 13, color: colors.textSecondary}}>{t('rfq.signHere')}</Text>
                </>
              )}
            </TouchableOpacity>
            <ErrorText msg={errors.signed ?? ''} />

            {/* Terms */}
            <TouchableOpacity
              style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16}}
              onPress={() => {setTermsAccepted(v => !v); setErrors(e => ({...e, terms: ''}));}}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: termsAccepted ? colors.primary : colors.card,
                  borderColor: termsAccepted ? colors.primary : colors.border,
                }}
              >
                {termsAccepted && <Icon name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={{fontSize: 13, color: colors.textPrimary, flex: 1}}>{t('rfq.terms')}</Text>
            </TouchableOpacity>
            <ErrorText msg={errors.terms ?? ''} />
          </View>

          {/* SUBMIT */}
          <View style={{paddingHorizontal: 16, marginTop: 16, marginBottom: 8}}>
            <PremiumButton
              title={t('common.submitRFQ')}
              iconName="send"
              variant="primary"
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* PICKER MODAL */}
      <Modal visible={picker.visible} transparent animationType="slide" onRequestClose={closePicker}>
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
            <Text style={{fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12}}>
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
        visible={isActive && currentStep === 'rfq_form'}
        stepNumber={9} totalSteps={18}
        title={tDemo('tour.rfq_form.title')}
        description={tDemo('tour.rfq_form.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'rfq_submitted'}
        stepNumber={10} totalSteps={18}
        title={tDemo('tour.rfq_submitted.title')}
        description={tDemo('tour.rfq_submitted.description')}
        onNext={() => {
          nextStep();
          navigation.navigate('RFQDetail', {rfqId: 'RFQ_DEMO_001'});
        }}
      />

      <DemoFloatingBar />

      {/* BROADCASTING OVERLAY */}
      {isBroadcasting && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(16,24,40,0.96)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: '600',
              marginTop: 20,
              textAlign: 'center',
              writingDirection: i18n.language === 'ar' ? 'rtl' : 'ltr',
            }}
          >
            {t('demo:messages.broadcastingToSuppliers')}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.78)',
              fontSize: 13,
              marginTop: 10,
              textAlign: 'center',
              lineHeight: 20,
              writingDirection: i18n.language === 'ar' ? 'rtl' : 'ltr',
            }}
          >
            {i18n.language === 'ar'
              ? 'سيتلقى الموردون في عُمان طلبك خلال لحظات'
              : 'Suppliers in Oman will receive your RFQ shortly'}
          </Text>
        </View>
      )}
    </View>
  );
}

