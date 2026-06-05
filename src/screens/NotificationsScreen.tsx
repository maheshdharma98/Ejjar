import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useAppStore} from '../store/appStore';

interface RawNotification {
  id: string; user_id: string; type: string;
  title: string; message: string; read: boolean; created_at: string;
}

const rawNotifications: RawNotification[] = require('../../../shared/mock/notifications.json');

type Nav = NativeStackNavigationProp<RootStackParamList>;

const NOTIF_ICON: Record<string, {emoji: string; bg: string}> = {
  RFQ_BROADCAST: {emoji: '📋', bg: '#E8EEFB'},
  RFQ_RESPONSE:  {emoji: '💬', bg: '#DCFCE7'},
  RFQ_CONFIRMED: {emoji: '✅', bg: '#DCFCE7'},
  JOB_COMPLETED: {emoji: '🏁', bg: '#EDE9FE'},
  REVIEW_REQUEST:{emoji: '⭐', bg: '#FEF3C7'},
  NEW_QUOTE:     {emoji: '💰', bg: '#E8EEFB'},
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
}

function SkeletonItem() {
  const bg = '#E5E7EB';
  return (
    <View className="bg-white rounded-2xl mb-2 p-4 flex-row items-center">
      <View style={{width: 4, height: 48, borderRadius: 2, backgroundColor: bg, marginRight: 12}} />
      <View style={{width: 40, height: 40, borderRadius: 10, backgroundColor: bg, marginRight: 12}} />
      <View className="flex-1">
        <View style={{width: '60%', height: 13, borderRadius: 4, backgroundColor: bg}} />
        <View style={{width: '80%', height: 11, borderRadius: 4, backgroundColor: bg, marginTop: 6}} />
        <View style={{width: '25%', height: 10, borderRadius: 4, backgroundColor: bg, marginTop: 5}} />
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {markAllRead} = useAppStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readSet, setReadSet] = useState<Set<string>>(
    new Set(rawNotifications.filter(n => n.read).map(n => n.id)),
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleMarkAll = () => {
    setReadSet(new Set(rawNotifications.map(n => n.id)));
    markAllRead();
  };

  const handleTap = (notif: RawNotification) => {
    setReadSet(prev => new Set([...prev, notif.id]));
    const type = notif.type;
    if (type === 'RFQ_BROADCAST' || type === 'RFQ_RESPONSE' || type === 'NEW_QUOTE') {
      navigation.navigate('RFQDetail', {rfqId: 'rfq-002'});
    } else if (type === 'RFQ_CONFIRMED' || type === 'JOB_COMPLETED') {
      navigation.navigate('JobTracking', {jobId: 'job-001'});
    } else if (type === 'REVIEW_REQUEST') {
      navigation.navigate('Review', {jobId: 'job-001', supplierId: 'sup-004'});
    }
  };

  const renderItem = ({item}: {item: RawNotification}) => {
    const isRead = readSet.has(item.id);
    const icon = NOTIF_ICON[item.type] ?? {emoji: '🔔', bg: '#F5F7FA'};
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl mb-2 p-4 flex-row"
        activeOpacity={0.8}
        onPress={() => handleTap(item)}
      >
        <View className="w-1 rounded-full self-stretch me-3" style={{backgroundColor: isRead ? 'transparent' : '#1A4FBA'}} />
        <View className="w-10 h-10 rounded-2xl items-center justify-center me-3" style={{backgroundColor: icon.bg}}>
          <Text style={{fontSize: 18}}>{icon.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className={`text-sm text-[#1A1A2E] ${isRead ? 'font-normal' : 'font-bold'}`} numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-xs text-[#6B7280] mt-0.5" numberOfLines={1}>{item.message}</Text>
          <Text className="text-xs text-[#9CA3AF] mt-1">{fmtTime(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center pt-24">
      <Text style={{fontSize: 40}}>🎉</Text>
      <Text className="text-[#6B7280] text-base mt-3">{t('notifications.empty')}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      {/* HEADER */}
      <View
        className="bg-white shadow-sm flex-row items-center justify-between px-4"
        style={{paddingTop: insets.top + 12, paddingBottom: 12}}
      >
        <Text className="text-[#1A1A2E] text-xl font-bold">{t('notifications.title')}</Text>
        <TouchableOpacity onPress={handleMarkAll} activeOpacity={0.7}>
          <Text className="text-[#1A4FBA] text-sm">{t('notifications.markAllRead')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingTop: 12}}>
          <SkeletonItem /><SkeletonItem /><SkeletonItem /><SkeletonItem />
        </ScrollView>
      ) : (
        <FlatList
          data={rawNotifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 + insets.bottom, flexGrow: 1}}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A4FBA']} tintColor="#1A4FBA" />}
        />
      )}
    </View>
  );
}
