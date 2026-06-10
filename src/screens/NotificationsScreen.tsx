import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useAppStore} from '../store/appStore';
import Icon from '../components/common/Icon';
import {colors, shadows} from '../theme/designSystem';

interface DemoNotification {
  id: number; type: string;
  titleEn: string; titleAr: string;
  bodyEn: string; bodyAr: string;
  time: string; read: boolean;
}

const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 1,
    titleEn: 'New quote received',
    titleAr: 'عرض جديد وصل',
    bodyEn: 'Rashid Al-Saadi sent a quote of OMR 220 for your RFQ_DEMO_001',
    bodyAr: 'راشد السعدي أرسل عرضاً بـ 220 ر.ع. لطلبك RFQ_DEMO_001',
    time: '2h',
    type: 'quote',
    read: false,
  },
  {
    id: 2,
    titleEn: 'Counter offer from supplier',
    titleAr: 'عرض مقابل من المورد',
    bodyEn: 'Quote updated to OMR 200 — Accept or counter offer',
    bodyAr: 'تم تعديل العرض إلى 200 ر.ع. — اقبل أو قدّم عرضاً مقابلاً',
    time: '1h',
    type: 'negotiation',
    read: false,
  },
  {
    id: 3,
    titleEn: 'Job confirmed',
    titleAr: 'تم تأكيد العمل',
    bodyEn: 'Job JOB_001 started with Rashid Al-Saadi in Muscat',
    bodyAr: 'بدأ العمل JOB_001 مع راشد السعدي في مسقط',
    time: '30m',
    type: 'job',
    read: true,
  },
  {
    id: 4,
    titleEn: 'RFQ broadcasted',
    titleAr: 'طلبك تم بثّه',
    bodyEn: 'Your RFQ_DEMO_003 was sent to 4 suppliers in Oman',
    bodyAr: 'تم إرسال طلبك RFQ_DEMO_003 إلى 4 موردين في عُمان',
    time: '45m',
    type: 'rfq',
    read: true,
  },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'all' | 'unread' | 'rfq' | 'job';

const FILTERS: {key: FilterKey; labelEn: string; labelAr: string; icon: string}[] = [
  {key: 'all',    labelEn: 'All',    labelAr: 'الكل',      icon: 'bell-outline'},
  {key: 'unread', labelEn: 'Unread', labelAr: 'غير مقروء', icon: 'clock-outline'},
  {key: 'rfq',    labelEn: 'RFQs',   labelAr: 'الطلبات',  icon: 'bullhorn'},
  {key: 'job',    labelEn: 'Jobs',   labelAr: 'الأعمال',   icon: 'briefcase-outline'},
];

const NOTIF_ICON: Record<string, {iconName: string; bg: string; color: string}> = {
  quote:       {iconName: 'cash-multiple',        bg: colors.primaryLight,  color: colors.primary},
  negotiation: {iconName: 'swap-horizontal',      bg: colors.warningLight,  color: colors.warning},
  job:         {iconName: 'briefcase-check',      bg: '#DCFCE7',            color: colors.success},
  rfq:         {iconName: 'bullhorn',             bg: '#EDE9FE',            color: '#7C3AED'},
};

function SkeletonItem() {
  const bg = '#E2E8F0';
  return (
    <View style={{backgroundColor: colors.card, borderRadius: 16, marginBottom: 8, padding: 14, flexDirection: 'row', alignItems: 'center'}}>
      <View style={{width: 4, height: 48, borderRadius: 2, backgroundColor: bg, marginRight: 12}} />
      <View style={{width: 48, height: 48, borderRadius: 12, backgroundColor: bg, marginRight: 12}} />
      <View style={{flex: 1, gap: 6}}>
        <View style={{width: '60%', height: 13, borderRadius: 4, backgroundColor: bg}} />
        <View style={{width: '80%', height: 11, borderRadius: 4, backgroundColor: bg}} />
        <View style={{width: '25%', height: 10, borderRadius: 4, backgroundColor: bg}} />
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const {t, i18n} = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {markAllRead} = useAppStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [readSet, setReadSet] = useState<Set<number>>(
    new Set(DEMO_NOTIFICATIONS.filter(n => n.read).map(n => n.id)),
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleMarkAll = () => {
    setReadSet(new Set(DEMO_NOTIFICATIONS.map(n => n.id)));
    markAllRead();
  };

  const handleTap = (notif: DemoNotification) => {
    setReadSet(prev => new Set([...prev, notif.id]));
    if (notif.type === 'rfq' || notif.type === 'negotiation' || notif.type === 'quote') {
      navigation.navigate('RFQDetail', {rfqId: 'RFQ_DEMO_001'});
    } else if (notif.type === 'job') {
      navigation.navigate('JobTracking', {jobId: 'JOB_001'});
    }
  };

  const unreadCount = DEMO_NOTIFICATIONS.filter(n => !readSet.has(n.id)).length;

  const filtered = useMemo(() => {
    if (activeFilter === 'unread') return DEMO_NOTIFICATIONS.filter(n => !readSet.has(n.id));
    if (activeFilter === 'rfq') return DEMO_NOTIFICATIONS.filter(n => n.type === 'rfq' || n.type === 'negotiation' || n.type === 'quote');
    if (activeFilter === 'job') return DEMO_NOTIFICATIONS.filter(n => n.type === 'job');
    return DEMO_NOTIFICATIONS;
  }, [activeFilter, readSet]);

  const renderItem = ({item}: {item: DemoNotification}) => {
    const isRead = readSet.has(item.id);
    const icon = NOTIF_ICON[item.type] ?? {iconName: 'bell-outline', bg: '#F1F5F9', color: colors.textSecondary};

    return (
      <TouchableOpacity
        style={[{
          backgroundColor: colors.card, borderRadius: 16, marginBottom: 8,
          flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden',
        }, shadows.sm]}
        activeOpacity={0.8}
        onPress={() => handleTap(item)}
      >
        {/* Unread indicator bar */}
        <View style={{
          width: 4, alignSelf: 'stretch',
          backgroundColor: isRead ? 'transparent' : colors.primary,
          borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
        }} />

        <View style={{flex: 1, flexDirection: 'row', alignItems: 'flex-start', padding: 14}}>
          {/* Icon circle */}
          <View style={{
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: icon.bg, alignItems: 'center', justifyContent: 'center',
            marginEnd: 12, flexShrink: 0,
          }}>
            <Icon name={icon.iconName} size={22} color={icon.color} />
          </View>

          {/* Content */}
          <View style={{flex: 1}}>
            <Text
              style={{fontSize: 14, color: colors.textPrimary, fontWeight: isRead ? '400' : '700'}}
              numberOfLines={1}
            >
              {isAr ? item.titleAr : item.titleEn}
            </Text>
            <Text style={{fontSize: 12, color: colors.textSecondary, marginTop: 3}} numberOfLines={2}>
              {isAr ? item.bodyAr : item.bodyEn}
            </Text>
            <Text style={{fontSize: 11, color: colors.muted, marginTop: 4}}>
              {isAr ? `منذ ${item.time}` : `${item.time} ago`}
            </Text>
          </View>

          {/* Trailing */}
          <View style={{alignItems: 'center', gap: 6, marginStart: 8}}>
            {!isRead && (
              <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary}} />
            )}
            <Icon name="chevron-right" size={18} color={colors.muted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80}}>
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Icon name="bell-sleep-outline" size={36} color={colors.primary} />
      </View>
      <Text style={{fontSize: 17, fontWeight: '700', color: colors.textPrimary}}>
        {t('notifications.empty')}
      </Text>
      <Text style={{fontSize: 14, color: colors.textSecondary, marginTop: 6}}>
        {isAr ? 'لا توجد إشعارات جديدة' : "You're all caught up"}
      </Text>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* HEADER */}
      <View style={[{
        backgroundColor: colors.card,
        paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center',
      }, shadows.sm]}>
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Text style={{fontSize: 20, fontWeight: '700', color: colors.textPrimary}}>
              {t('notifications.title')}
            </Text>
            {unreadCount > 0 && (
              <View style={{
                backgroundColor: colors.error, borderRadius: 10,
                paddingHorizontal: 7, paddingVertical: 2,
              }}>
                <Text style={{fontSize: 11, fontWeight: '700', color: '#FFFFFF'}}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleMarkAll}
          style={{flexDirection: 'row', alignItems: 'center', gap: 5}}
          activeOpacity={0.7}
        >
          <Icon name="check-all" size={16} color={colors.primary} />
          <Text style={{fontSize: 13, color: colors.primary, fontWeight: '500'}}>
            {t('notifications.markAllRead')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FILTER CHIPS */}
      <View style={{backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border}}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 10, gap: 8}}
        >
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
                  backgroundColor: isActive ? colors.primary : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
                activeOpacity={0.8}
              >
                <Icon name={f.icon} size={13} color={isActive ? '#FFFFFF' : colors.textSecondary} />
                <Text style={{
                  fontSize: 13, fontWeight: '500',
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                }}>
                  {isAr ? f.labelAr : f.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingTop: 12}}>
          <SkeletonItem /><SkeletonItem /><SkeletonItem /><SkeletonItem />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: 16, paddingTop: 12,
            paddingBottom: 24 + insets.bottom, flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}
