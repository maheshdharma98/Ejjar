import React, {useState} from 'react';
import {
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

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useToastStore} from '../store/toastStore';
import {maskPhone} from '../utils/masking';

const GCC = require('../../../shared/mock/gcc_regions.json') as Record<string, string[]>;
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

const COUNTRY_OPTIONS = Object.keys(GCC).map(c => ({label: c, value: c}));
const getCities = (country: string): Option[] =>
  (GCC[country] ?? []).map((c: string) => ({label: c, value: c}));
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
// Shared field components
// ---------------------------------------------------------------------------

function SelectField({label, value, onPress}: {label: string; value: string; onPress: () => void}) {
  return (
    <View className="mb-4">
      <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{label}</Text>
      <TouchableOpacity
        className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 flex-row items-center"
        activeOpacity={0.7}
        onPress={onPress}
      >
        <Text className={`flex-1 text-base ${value ? 'text-[#1A1A2E]' : 'text-[#9CA3AF]'}`} numberOfLines={1}>
          {value || label}
        </Text>
        <Text className="text-[#6B7280]">▼</Text>
      </TouchableOpacity>
    </View>
  );
}

function Toggle({value, onToggle}: {value: boolean; onToggle: () => void}) {
  return (
    <TouchableOpacity
      className={`w-[51px] h-[31px] rounded-full justify-center px-0.5 ${value ? 'bg-[#1A4FBA]' : 'bg-[#E5E7EB]'}`}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View className={`w-[27px] h-[27px] rounded-full bg-white shadow-sm ${value ? 'self-end' : 'self-start'}`} />
    </TouchableOpacity>
  );
}

function ErrorText({msg}: {msg: string}) {
  if (!msg) return null;
  return <Text className="text-[#EF4444] text-xs mt-1 ps-1">{msg}</Text>;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function RFQFormScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {showToast} = useToastStore();

  const {category, params} = route.params;
  const initCountry = (params?.country as string) ?? '';
  const initCity = (params?.city as string) ?? '';

  // Common fields
  const [description, setDescription] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [country, setCountry] = useState(initCountry);
  const [city, setCity] = useState(initCity);
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
  const [shpPickupCountry, setShpPickupCountry] = useState(initCountry);
  const [shpPickupCity, setShpPickupCity] = useState(initCity);
  const [shpDropoffCountry, setShpDropoffCountry] = useState('');
  const [shpDropoffCity, setShpDropoffCity] = useState('');

  // Picker
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
    if (!dateFrom.trim()) e.dateFrom = t('common.required');
    if (!dateTo.trim()) e.dateTo = t('common.required');
    if (!country) e.country = t('common.required');
    if (!signed) e.signed = t('common.required');
    if (!termsAccepted) e.terms = t('common.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    showToast(t('rfq.sent'), 'success');
    navigation.navigate('RFQDetail', {rfqId: 'rfq-002'});
  };

  const labelOf = (slug: string, list: Option[]) =>
    list.find(o => o.value === slug)?.label ?? '';

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View
          className="bg-white shadow-sm flex-row items-center px-4"
          style={{paddingTop: insets.top + 12, paddingBottom: 12}}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} className="me-3 p-1" hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text className="text-[#1A4FBA] text-xl font-bold" style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#1A1A2E] flex-1">{t('rfq.title')}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
          {/* BROADCAST NOTICE */}
          <View className="bg-[#E8EEFB] rounded-2xl p-4 mx-4 mt-4 flex-row items-start">
            <Text style={{fontSize: 20}}>📢</Text>
            <Text className="text-sm text-[#1A4FBA] ms-3 flex-1 leading-5">{t('rfq.broadcastNotice')}</Text>
          </View>

          {/* COMMON FORM CARD */}
          <View className="bg-white rounded-2xl shadow-sm mx-4 mt-4 p-4">
            <View className="mb-4">
              <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{t('rfq.description')}</Text>
              <TextInput
                className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-[#1A1A2E] text-base"
                value={description}
                onChangeText={v => {setDescription(v); setErrors(e => ({...e, description: ''}));}}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder={t('rfq.description')}
                placeholderTextColor="#9CA3AF"
              />
              <ErrorText msg={errors.description ?? ''} />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 mb-4">
                <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{t('rfq.dateFrom')}</Text>
                <TextInput
                  className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                  value={dateFrom}
                  onChangeText={v => {setDateFrom(v); setErrors(e => ({...e, dateFrom: ''}));}}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                />
                <ErrorText msg={errors.dateFrom ?? ''} />
              </View>
              <View className="flex-1 mb-4">
                <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{t('rfq.dateTo')}</Text>
                <TextInput
                  className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                  value={dateTo}
                  onChangeText={v => {setDateTo(v); setErrors(e => ({...e, dateTo: ''}));}}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                />
                <ErrorText msg={errors.dateTo ?? ''} />
              </View>
            </View>

            <SelectField
              label={t('home.country')}
              value={country}
              onPress={() =>
                openPicker(t('common.selectCountry'), COUNTRY_OPTIONS, (v, _l) => {
                  setCountry(v); setCity(''); setErrors(e => ({...e, country: ''})); closePicker();
                })
              }
            />
            <ErrorText msg={errors.country ?? ''} />

            <SelectField
              label={t('home.city')}
              value={city}
              onPress={() =>
                openPicker(t('common.selectCity'), getCities(country), (v, _l) => {
                  setCity(v); closePicker();
                })
              }
            />

            {/* Attach file */}
            <View>
              <TouchableOpacity
                className="border-2 border-[#1A4FBA] h-[44px] rounded-xl items-center justify-center"
                activeOpacity={0.7}
                onPress={() => setFileName('requirements.pdf')}
              >
                <Text className="text-[#1A4FBA] text-sm font-medium">{t('rfq.attachFile')}</Text>
              </TouchableOpacity>
              {fileName && (
                <View className="flex-row mt-2">
                  <View className="bg-[#E8EEFB] rounded-full px-3 py-1 self-start flex-row items-center gap-1">
                    <Text className="text-[#1A4FBA] text-xs">📎</Text>
                    <Text className="text-[#1A4FBA] text-xs">{fileName}</Text>
                    <TouchableOpacity onPress={() => setFileName(null)} hitSlop={{top: 4, bottom: 4, left: 4, right: 4}}>
                      <Text className="text-[#1A4FBA] text-xs ms-1">✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* DYNAMIC CATEGORY CARD */}
          <View className="bg-white rounded-2xl shadow-sm mx-4 mt-3 p-4">
            {/* MANPOWER */}
            {category === 'manpower' && (
              <>
                <Text className="text-[#1A1A2E] text-sm font-bold mb-3">Manpower Details</Text>
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{t('home.quantity')}</Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={mpQty}
                    onChangeText={setMpQty}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <SelectField
                  label={t('home.role')}
                  value={mpRoleLabel}
                  onPress={() =>
                    openPicker(t('home.role'), MP_ROLES, (v, l) => {setMpRole(v); setMpRoleLabel(l); closePicker();})
                  }
                />
                <SelectField
                  label={t('home.skillLevel')}
                  value={mpSkillLabel}
                  onPress={() =>
                    openPicker(t('home.skillLevel'), SKILL_LEVELS, (v, l) => {setMpSkill(v); setMpSkillLabel(l); closePicker();})
                  }
                />
                <Text className="text-[#1A1A2E] text-sm font-medium mb-2">Secondary Skills</Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {MP_ROLES.map(r => {
                    const sel = mpSecondary.includes(r.value);
                    return (
                      <TouchableOpacity
                        key={r.value}
                        onPress={() => toggleSecondary(r.value)}
                        className={`rounded-full px-3 py-1.5 ${sel ? 'bg-[#1A4FBA]' : 'bg-[#F5F7FA] border border-[#E5E7EB]'}`}
                        activeOpacity={0.7}
                      >
                        <Text className={`text-xs font-medium ${sel ? 'text-white' : 'text-[#6B7280]'}`}>{r.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* MACHINERY */}
            {category === 'machinery' && (
              <>
                <Text className="text-[#1A1A2E] text-sm font-bold mb-3">Equipment Details</Text>
                <SelectField
                  label={t('home.machinery')}
                  value={mchTypeLabel}
                  onPress={() =>
                    openPicker(t('home.machinery'), MCH_TYPES, (v, l) => {setMchType(v); setMchTypeLabel(l); closePicker();})
                  }
                />
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{t('home.quantity')}</Text>
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
                  <Text className="text-[#1A1A2E] text-sm font-medium">{t('home.operatorNeeded')}</Text>
                  <Toggle value={mchOperator} onToggle={() => setMchOperator(v => !v)} />
                </View>
                <SelectField
                  label={t('home.duration')}
                  value={mchDurationLabel}
                  onPress={() =>
                    openPicker(t('home.duration'), DURATIONS, (v, l) => {setMchDuration(v); setMchDurationLabel(l); closePicker();})
                  }
                />
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">Capacity</Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={mchCapacity}
                    onChangeText={setMchCapacity}
                    placeholder="e.g. 20 tonnes"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </>
            )}

            {/* VEHICLES */}
            {category === 'vehicles' && (
              <>
                <Text className="text-[#1A1A2E] text-sm font-bold mb-3">Vehicle Details</Text>
                <SelectField
                  label="Vehicle Type"
                  value={vehTypeLabel}
                  onPress={() =>
                    openPicker('Vehicle Type', VEH_TYPES, (v, l) => {setVehType(v); setVehTypeLabel(l); closePicker();})
                  }
                />
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium">{t('home.driverNeeded')}</Text>
                  <Toggle value={vehDriver} onToggle={() => setVehDriver(v => !v)} />
                </View>
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">Rental Period</Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={vehPeriod}
                    onChangeText={setVehPeriod}
                    placeholder="e.g. 30 days"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">KM Limit</Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={vehKm}
                    onChangeText={setVehKm}
                    keyboardType="number-pad"
                    placeholder="Unlimited"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <SelectField
                  label="Seating Capacity"
                  value={vehSeatingLabel}
                  onPress={() =>
                    openPicker('Seating Capacity', SEATING, (v, l) => {setVehSeating(v); setVehSeatingLabel(l); closePicker();})
                  }
                />
              </>
            )}

            {/* SHIPPING */}
            {category === 'shipping' && (
              <>
                <Text className="text-[#1A1A2E] text-sm font-bold mb-3">Shipment Details</Text>
                <SelectField
                  label={t('home.packageType')}
                  value={shpTypeLabel}
                  onPress={() =>
                    openPicker(t('home.packageType'), SHP_TYPES, (v, l) => {setShpType(v); setShpTypeLabel(l); closePicker();})
                  }
                />
                <View className="mb-4">
                  <Text className="text-[#1A1A2E] text-sm font-medium mb-1 ps-1">{t('home.weight')}</Text>
                  <TextInput
                    className="bg-white border border-[#E5E7EB] rounded-xl h-[48px] px-4 text-[#1A1A2E] text-base"
                    value={shpWeight}
                    onChangeText={setShpWeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="flex-row justify-around mb-4">
                  {[
                    {label: t('home.fragile'), val: shpFragile, fn: () => setShpFragile(v => !v)},
                    {label: t('home.hazmat'), val: shpHazmat, fn: () => setShpHazmat(v => !v)},
                    {label: t('home.coldChain'), val: shpColdChain, fn: () => setShpColdChain(v => !v)},
                  ].map(tog => (
                    <View key={tog.label} className="items-center gap-2">
                      <Text className="text-[#1A1A2E] text-xs font-medium text-center">{tog.label}</Text>
                      <Toggle value={tog.val} onToggle={tog.fn} />
                    </View>
                  ))}
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <SelectField label={t('home.pickupCountry')} value={shpPickupCountry}
                      onPress={() => openPicker(t('common.selectCountry'), COUNTRY_OPTIONS, (v, _l) => {setShpPickupCountry(v); setShpPickupCity(''); closePicker();})} />
                  </View>
                  <View className="flex-1">
                    <SelectField label={t('home.pickupCity')} value={shpPickupCity}
                      onPress={() => openPicker(t('common.selectCity'), getCities(shpPickupCountry), (v, _l) => {setShpPickupCity(v); closePicker();})} />
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <SelectField label={t('home.dropoffCountry')} value={shpDropoffCountry}
                      onPress={() => openPicker(t('common.selectCountry'), COUNTRY_OPTIONS, (v, _l) => {setShpDropoffCountry(v); setShpDropoffCity(''); closePicker();})} />
                  </View>
                  <View className="flex-1">
                    <SelectField label={t('home.dropoffCity')} value={shpDropoffCity}
                      onPress={() => openPicker(t('common.selectCity'), getCities(shpDropoffCountry), (v, _l) => {setShpDropoffCity(v); closePicker();})} />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* SIGNATURE & TERMS CARD */}
          <View className="bg-white rounded-2xl shadow-sm mx-4 mt-3 p-4">
            <TouchableOpacity
              onPress={() => {setSigned(true); setErrors(e => ({...e, signed: ''}));}}
              activeOpacity={0.8}
              className={`h-[90px] rounded-xl items-center justify-center ${
                signed
                  ? 'bg-[#DCFCE7] border-2 border-[#22C55E]'
                  : 'border-2 border-dashed border-[#E5E7EB]'
              }`}
            >
              {signed ? (
                <View className="items-center">
                  <Text className="text-[#15803D] text-2xl font-bold">✓</Text>
                  <Text className="text-[#15803D] text-sm font-medium mt-1">{t('rfq.signed')}</Text>
                </View>
              ) : (
                <View className="items-center">
                  <Text style={{fontSize: 24}}>✍️</Text>
                  <Text className="text-[#9CA3AF] text-sm mt-1">{t('rfq.signHere')}</Text>
                </View>
              )}
            </TouchableOpacity>
            <ErrorText msg={errors.signed ?? ''} />

            <TouchableOpacity
              className="flex-row items-center gap-3 mt-4"
              onPress={() => {setTermsAccepted(v => !v); setErrors(e => ({...e, terms: ''}));}}
            >
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
                termsAccepted ? 'bg-[#1A4FBA] border-[#1A4FBA]' : 'border-[#E5E7EB] bg-white'
              }`}>
                {termsAccepted && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-[#1A1A2E] text-sm flex-1">{t('rfq.terms')}</Text>
            </TouchableOpacity>
            <ErrorText msg={errors.terms ?? ''} />
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            className="bg-[#1A4FBA] h-[52px] rounded-2xl items-center justify-center mx-4 mb-8 mt-4"
            style={{shadowColor: '#1A4FBA', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6}}
            activeOpacity={0.8}
            onPress={handleSubmit}
          >
            <Text className="text-white text-base font-semibold tracking-wide">{t('common.submitRFQ')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* PICKER MODAL */}
      <Modal visible={picker.visible} transparent animationType="slide" onRequestClose={closePicker}>
        <TouchableOpacity className="flex-1 bg-black/50 justify-end" activeOpacity={1} onPress={closePicker}>
          <TouchableOpacity activeOpacity={1} className="bg-white rounded-t-3xl px-4 pt-3 pb-8">
            <View className="w-10 h-1 bg-[#E5E7EB] rounded-full self-center mb-4" />
            <Text className="text-[#1A1A2E] text-lg font-bold mb-3">{picker.title}</Text>
            <FlatList
              data={picker.options}
              keyExtractor={item => item.value}
              style={{maxHeight: 340}}
              ItemSeparatorComponent={() => <View className="h-px bg-[#F5F7FA]" />}
              renderItem={({item}) => (
                <TouchableOpacity className="py-4 px-2" activeOpacity={0.7} onPress={() => picker.onSelect(item.value, item.label)}>
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
