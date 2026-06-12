import React, {useMemo, useState} from 'react';
import {FlatList, I18nManager, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from '../components/common/Icon';

import type {RootStackParamList} from '../navigation/RootNavigator';
import type {Supplier} from '../types';
import {maskPhone, maskLocation} from '../utils/masking';
import {colors, shadows} from '../theme/designSystem';
import {categoryColors, categoryBgColors} from '../utils/iconMap';
import CategoryIcon from '../components/common/CategoryIcon';
import StatusBadge from '../components/common/StatusBadge';
import StarRating from '../components/common/StarRating';
import VerifiedBadge from '../components/common/VerifiedBadge';
import SectionHeader from '../components/common/SectionHeader';
import {useDemoData} from '../store/demoDataStore';
import {formatCurrency, getLocalizedField} from '../utils/arabicFormatters';
import type {Supplier as DemoSupplier} from '../../../shared/types/demo';

interface RawResource {
  id: string;
  supplier_id: string;
  category: string;
  subcategory: string;
  status: string;
  availability_start: string;
  availability_end: string;
  specs: Record<string, unknown>;
}
interface RawReview {
  id: string;
  job_id: string;
  contractor_id: string;
  supplier_id: string;
  rating: number;
  text: string;
  created_at: string;
}

const suppliersData: Supplier[] = require('../../../shared/mock/suppliers.json');
const resourcesData: RawResource[] = require('../../../shared/mock/resources.json');
const reviewsData: RawReview[] = require('../../../shared/mock/reviews.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SupplierProfile'>;

type TabKey = 'overview' | 'resources' | 'certifications' | 'reviews';

const TABS: {key: TabKey; labelKey: string; icon: string}[] = [
  {key: 'overview', labelKey: 'profile.overview', icon: 'information-outline'},
  {key: 'resources', labelKey: 'profile.resources', icon: 'package-variant'},
  {key: 'certifications', labelKey: 'profile.certifications', icon: 'certificate'},
  {key: 'reviews', labelKey: 'profile.reviews', icon: 'star-outline'},
];

const TIER_STYLE: Record<string, {bg: string; color: string; label: string}> = {
  basic:    {bg: 'rgba(255,255,255,0.15)', color: '#FFFFFF', label: 'Basic'},
  pro:      {bg: 'rgba(255,255,255,0.2)',  color: '#FFFFFF', label: 'Pro'},
  platinum: {bg: 'rgba(201,169,97,0.3)',   color: '#FFD700', label: 'Platinum'},
};

const CERTS = [
  {name: 'ISO 9001 Certified',          validUntil: '31 Dec 2026'},
  {name: 'OHSAS 18001 Health & Safety', validUntil: '15 Jun 2026'},
  {name: 'Valid Trade License',          validUntil: '01 Jan 2027'},
  {name: 'Civil Defense Approval',       validUntil: '30 Sep 2026'},
  {name: 'Municipality Permit',          validUntil: '31 Mar 2026'},
  {name: 'ISO 14001 Environmental',      validUntil: '20 Nov 2026'},
];

export default function SupplierProfileScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const {supplierId} = route.params;
  const getSupplierById = useDemoData(s => s.getSupplierById);
  const demoSupplier: DemoSupplier | undefined = getSupplierById(supplierId);
  const legacySupplier = suppliersData.find(s => s.id === supplierId);
  const supplier = legacySupplier;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const resources = useMemo(
    () => resourcesData.filter(r => r.supplier_id === supplierId),
    [supplierId],
  );
  const reviews = useMemo(
    () => reviewsData.filter(r => r.supplier_id === supplierId),
    [supplierId],
  );
  const legacyAvgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : supplier?.rating ?? 0;

  if (!demoSupplier && !supplier) {
    return (
      <View style={{flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: colors.textSecondary}}>{t('common.noResults')}</Text>
      </View>
    );
  }

  // Unified display values — prefer demo data when available
  const displayCompany = demoSupplier
    ? getLocalizedField(demoSupplier, 'company')
    : supplier?.name ?? '';
  const displayCity = demoSupplier
    ? getLocalizedField(demoSupplier, 'city')
    : supplier ? maskLocation(supplier.city, 3) : '';
  const displayDescription = demoSupplier
    ? getLocalizedField(demoSupplier, 'description')
    : supplier?.description ?? '';
  const displayRating = demoSupplier?.rating ?? legacyAvgRating;
  const displayVerified = demoSupplier?.verified ?? supplier?.verified ?? false;
  const displayTotalJobs = demoSupplier?.totalJobs ?? resources.length;
  const displayYearsExp = demoSupplier ? `${demoSupplier.yearsExperience}+` : '4+';
  const displayResponseTime = demoSupplier?.responseTime ?? '< 2h';
  const displayPhone = demoSupplier?.phone ?? supplier?.phone ?? '';
  const displayCategory = demoSupplier?.category ?? supplier?.categories?.[0] ?? 'manpower';
  const displayAvailability = demoSupplier?.availability ?? 'available';

  const tier = supplier ? (TIER_STYLE[supplier.subscription_tier] ?? TIER_STYLE.basic) : TIER_STYLE.platinum;
  const initials = displayCompany
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  const primaryCategory = displayCategory;

  // Rating breakdown (per star count)
  const starCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
  }));
  const totalReviews = reviews.length || 1;

  return (
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>

      {/* DARK NAVY HERO HEADER */}
      <View
        style={{
          backgroundColor: '#101828',
          paddingTop: insets.top + 12,
          paddingBottom: 32,
          paddingHorizontal: 16,
        }}
      >
        {/* Back + Share */}
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <View style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="share-variant" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Centered profile */}
        <View style={{alignItems: 'center', marginTop: 16}}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{fontSize: 28, fontWeight: '600', color: '#FFFFFF'}}>{initials}</Text>
          </View>

          <Text style={{fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginTop: 12, textAlign: 'center'}}>
            {displayCompany}
          </Text>

          {/* Chips row */}
          <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
            {displayVerified && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.5)',
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Icon name="check-decagram" size={13} color="#FFFFFF" />
                <Text style={{fontSize: 12, fontWeight: '600', color: '#FFFFFF'}}>{t('supplier.verified')}</Text>
              </View>
            )}
            {demoSupplier ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  backgroundColor: displayAvailability === 'available'
                    ? 'rgba(34,197,94,0.25)'
                    : displayAvailability === 'busy'
                    ? 'rgba(245,158,11,0.25)'
                    : 'rgba(239,68,68,0.25)',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: displayAvailability === 'available' ? '#22C55E'
                    : displayAvailability === 'busy' ? '#F59E0B' : '#EF4444',
                }}>
                  {t(`demo:labels.${displayAvailability}`)}
                </Text>
              </View>
            ) : (
              supplier && (
                <View
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: tier.bg,
                  }}
                >
                  <Text style={{fontSize: 12, fontWeight: '600', color: tier.color}}>
                    {supplier.subscription_tier.charAt(0).toUpperCase() + supplier.subscription_tier.slice(1)}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Stars */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10}}>
            <StarRating rating={displayRating} size={16} showNumber />
            <Text style={{fontSize: 12, color: 'rgba(255,255,255,0.8)'}}>
              ({demoSupplier ? displayTotalJobs : reviews.length} {t('supplier.reviews')})
            </Text>
          </View>

          {/* Location chip */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8}}>
            <Icon name="map-marker" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={{fontSize: 13, color: 'rgba(255,255,255,0.9)'}}>
              {displayCity}
            </Text>
          </View>
        </View>
      </View>

      {/* TABS ROW — overlap header */}
      <View
        style={[
          {
            marginHorizontal: 16,
            marginTop: -16,
            backgroundColor: colors.card,
            borderRadius: 16,
            flexDirection: 'row',
            padding: 4,
          },
          shadows.md,
        ]}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: isActive ? colors.primary : 'transparent',
                gap: 3,
              }}
              activeOpacity={0.8}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={isActive ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100}}
      >

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Stats grid 2x2 */}
            <View style={{flexDirection: 'row', gap: 12, marginBottom: 12}}>
              {[
                {value: `${displayTotalJobs}`, label: t('profile.totalJobs'), icon: 'briefcase-outline', color: colors.primary, bg: colors.primaryLight},
                {value: displayRating.toFixed(1), label: t('profile.reviews'), icon: 'star', color: colors.warning, bg: colors.warningLight},
              ].map(stat => (
                <View
                  key={stat.label}
                  style={[{flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16}, shadows.sm]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: stat.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Icon name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text style={{fontSize: 22, fontWeight: '600', color: colors.textPrimary}}>{stat.value}</Text>
                  <Text style={{fontSize: 10, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginTop: 3}}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{flexDirection: 'row', gap: 12, marginBottom: 16}}>
              {[
                {value: `${displayYearsExp} ${t('supplier.yearsShort')}`, label: t('supplier.yearsActive'), icon: 'calendar-check', color: '#64748B', bg: '#F1F5F9'},
                {value: displayResponseTime, label: t('supplier.responseTime'), icon: 'clock-fast', color: colors.success, bg: colors.successLight},
              ].map(stat => (
                <View
                  key={stat.label}
                  style={[{flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16}, shadows.sm]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: stat.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Icon name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text style={{fontSize: 22, fontWeight: '600', color: colors.textPrimary}}>{stat.value}</Text>
                  <Text style={{fontSize: 10, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginTop: 3}}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Price card — demo suppliers only */}
            {demoSupplier && (demoSupplier.pricePerDay ?? demoSupplier.pricePerHour) && (
              <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 12}, shadows.sm]}>
                {demoSupplier.pricePerDay && (
                  <View style={{flex: 1, alignItems: 'center'}}>
                    <Text style={{fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4}}>
                      {t('supplier.perDay')}
                    </Text>
                    <Text style={{fontSize: 22, fontWeight: '600', color: colors.primary}}>
                      {formatCurrency(demoSupplier.pricePerDay)}
                    </Text>
                  </View>
                )}
                {demoSupplier.pricePerDay && demoSupplier.pricePerHour && (
                  <View style={{width: 1, backgroundColor: colors.border}} />
                )}
                {demoSupplier.pricePerHour && (
                  <View style={{flex: 1, alignItems: 'center'}}>
                    <Text style={{fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4}}>
                      {t('supplier.perHour')}
                    </Text>
                    <Text style={{fontSize: 22, fontWeight: '600', color: colors.textPrimary}}>
                      {formatCurrency(demoSupplier.pricePerHour)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* About section */}
            <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12}, shadows.sm]}>
              <SectionHeader title={t('supplier.about')} iconName="information-outline" />
              <Text style={{fontSize: 14, color: '#475569', lineHeight: 22}}>{displayDescription}</Text>
            </View>

            {/* Services section */}
            <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12}, shadows.sm]}>
              <SectionHeader title={t('supplier.services')} iconName="briefcase-variant-outline" />
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                {[displayCategory].map(cat => {
                  const catColor = categoryColors[cat] ?? colors.primary;
                  const catBg = categoryBgColors[cat] ?? colors.primaryLight;
                  return (
                    <View
                      key={cat}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: catBg,
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <CategoryIcon category={cat} size={14} withBackground={false} />
                      <Text style={{fontSize: 12, fontWeight: '600', color: catColor, textTransform: 'capitalize'}}>
                        {t(`demo:categories.${cat}`)}
                      </Text>
                    </View>
                  );
                })}
                {demoSupplier?.subcategories?.map(sub => (
                  <View
                    key={sub}
                    style={{
                      backgroundColor: '#F1F5F9',
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{fontSize: 12, fontWeight: '600', color: '#64748B'}}>
                      {t(`demo:subcategories.${sub}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <>
            {resources.length === 0 ? (
              <View style={{alignItems: 'center', paddingVertical: 48}}>
                <Icon name="package-variant-closed" size={48} color="#CBD5E1" />
                <Text style={{color: colors.textSecondary, marginTop: 12, fontSize: 15}}>
                  {t('common.noResults')}
                </Text>
              </View>
            ) : (
              resources.map(res => {
                const specEntries = Object.entries(res.specs).slice(0, 3);
                return (
                  <View
                    key={res.id}
                    style={[
                      {
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                      },
                      shadows.sm,
                    ]}
                  >
                    <CategoryIcon category={res.category} size={18} withBackground />
                    <View style={{flex: 1, marginLeft: 12}}>
                      <Text style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary}} numberOfLines={1}>
                        {res.subcategory.replace(/_/g, ' ')}
                      </Text>
                      <Text style={{fontSize: 12, color: colors.textSecondary, marginTop: 2}} numberOfLines={1}>
                        {specEntries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ')}
                      </Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4}}>
                        <Icon name="phone-lock" size={12} color={colors.muted} />
                        <Text style={{fontSize: 11, color: colors.muted}}>{maskPhone(displayPhone)}</Text>
                      </View>
                    </View>
                    <StatusBadge status={res.status} />
                  </View>
                );
              })
            )}
          </>
        )}

        {/* CERTIFICATIONS TAB */}
        {activeTab === 'certifications' && (
          <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12}, shadows.sm]}>
            {demoSupplier ? (
              demoSupplier.certifications.length === 0 ? (
                <View style={{alignItems: 'center', paddingVertical: 32}}>
                  <Icon name="certificate-outline" size={48} color="#CBD5E1" />
                  <Text style={{color: colors.textSecondary, marginTop: 12}}>{t('common.noResults')}</Text>
                </View>
              ) : (
                demoSupplier.certifications.map((certName, i) => (
                  <View key={certName}>
                    <View style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 12}}>
                      <View style={{marginEnd: 12}}><Icon name="certificate" size={24} color={colors.gold} /></View>
                      <View style={{flex: 1}}>
                        <Text style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary}}>{certName}</Text>
                        <Text style={{fontSize: 11, color: colors.success, marginTop: 2}}>
                          {t('supplier.certActive')}
                        </Text>
                      </View>
                      <Icon name="check-circle" size={20} color={colors.success} />
                    </View>
                    {i < demoSupplier.certifications.length - 1 && (
                      <View style={{height: 1, backgroundColor: '#F8FAFC'}} />
                    )}
                  </View>
                ))
              )
            ) : (
              CERTS.map((cert, i) => (
                <View key={cert.name}>
                  <View style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 12}}>
                    <View style={{marginEnd: 12}}><Icon name="certificate" size={24} color={colors.gold} /></View>
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary}}>{cert.name}</Text>
                      <Text style={{fontSize: 11, color: colors.textSecondary, marginTop: 2}}>
                        {t('supplier.validUntil')} {cert.validUntil}
                      </Text>
                    </View>
                    <Icon name="check-circle" size={20} color={colors.success} />
                  </View>
                  {i < CERTS.length - 1 && (
                    <View style={{height: 1, backgroundColor: '#F8FAFC'}} />
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <>
            {/* Rating summary */}
            <View style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12}, shadows.sm]}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={{alignItems: 'center', marginRight: 20}}>
                  <Text style={{fontSize: 40, fontWeight: '600', color: colors.textPrimary}}>
                    {displayRating.toFixed(1)}
                  </Text>
                  <StarRating rating={displayRating} size={16} />
                  <Text style={{fontSize: 11, color: colors.textSecondary, marginTop: 4}}>
                    {reviews.length} reviews
                  </Text>
                </View>
                <View style={{flex: 1}}>
                  {starCounts.map(({star, count}) => (
                    <View key={star} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6}}>
                      <Text style={{fontSize: 11, color: colors.textSecondary, width: 8}}>{star}</Text>
                      <Icon name="star" size={11} color={colors.warning} />
                      <View style={{flex: 1, height: 6, backgroundColor: '#F8FAFC', borderRadius: 3}}>
                        <View
                          style={{
                            width: `${(count / totalReviews) * 100}%`,
                            height: 6,
                            backgroundColor: colors.warning,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                      <Text style={{fontSize: 11, color: colors.textSecondary, width: 20, textAlign: 'right'}}>
                        {count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {reviews.length === 0 ? (
              <View style={{alignItems: 'center', paddingVertical: 32}}>
                <Icon name="star-off" size={48} color="#CBD5E1" />
                <Text style={{color: colors.textSecondary, marginTop: 12}}>{t('common.noResults')}</Text>
              </View>
            ) : (
              reviews.map(rev => {
                const maskedName = 'Contractor #' + rev.contractor_id.slice(-4).toUpperCase();
                const date = new Date(rev.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const initLetter = maskedName.charAt(0);
                return (
                  <View
                    key={rev.id}
                    style={[{backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 8}, shadows.sm]}
                  >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: colors.primaryLight,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{fontSize: 14, fontWeight: '600', color: colors.primary}}>{initLetter}</Text>
                      </View>
                      <View style={{flex: 1}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                          <Text style={{fontSize: 13, fontWeight: '600', color: colors.textPrimary}}>
                            {maskedName}
                          </Text>
                          <VerifiedBadge />
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3}}>
                          <StarRating rating={rev.rating} size={12} />
                          <Text style={{fontSize: 11, color: colors.textSecondary}}>{date}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={{fontSize: 13, color: '#475569', lineHeight: 20, marginTop: 10}}>
                      {rev.text}
                    </Text>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: colors.primaryLight,
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        marginTop: 10,
                      }}
                    >
                      <Text style={{fontSize: 11, color: colors.primary, fontWeight: '600', textTransform: 'capitalize'}}>
                        {primaryCategory}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Bottom broadcast note */}
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16}}>
          <Icon name="information" size={14} color={colors.muted} />
          <Text style={{fontSize: 11, color: colors.muted, fontStyle: 'italic', textAlign: 'center', flex: 1}}>
            {t('rfq.broadcastNotice')}
          </Text>
        </View>
      </ScrollView>

      {/* SEND RFQ STICKY BUTTON */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.card,
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          shadowColor: '#101828',
          shadowOffset: {width: 0, height: -4},
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('RFQForm', {
              category: displayCategory,
              params: {
                subcategory: demoSupplier?.subcategories?.[0],
                supplierId,
                supplierName: displayCompany,
              },
            })
          }
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Icon name="send" size={20} color="#FFFFFF" />
          <Text style={{fontSize: 16, fontWeight: '600', color: '#FFFFFF'}}>
            {t('supplier.sendRFQ')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


