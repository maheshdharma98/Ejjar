import React from 'react';
import {I18nManager, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from '../components/common/Icon';
import {colors, shadows} from '../theme/designSystem';
import type {RootStackParamList} from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUBCATEGORIES: Record<string, {id: string; icon: string; enabled: boolean}[]> = {
  manpower: [
    {id: 'plumber', icon: 'pipe-wrench', enabled: true},
    {id: 'electrician', icon: 'lightning-bolt', enabled: false},
    {id: 'carpenter', icon: 'hammer', enabled: false},
    {id: 'mason', icon: 'wall', enabled: false},
    {id: 'welder', icon: 'fire', enabled: false},
    {id: 'painter', icon: 'brush', enabled: false},
  ],
  machinery: [
    {id: 'excavator', icon: 'excavator', enabled: true},
    {id: 'crane', icon: 'crane', enabled: false},
    {id: 'forklift', icon: 'forklift', enabled: false},
    {id: 'bulldozer', icon: 'bulldozer', enabled: false},
    {id: 'concrete_mixer', icon: 'cement-mixer', enabled: false},
  ],
  shipping: [
    {id: 'pallet', icon: 'package-variant', enabled: true},
    {id: 'container', icon: 'truck-cargo-container', enabled: false},
    {id: 'refrigerated', icon: 'snowflake', enabled: false},
    {id: 'flatbed', icon: 'truck-flatbed', enabled: false},
  ],
};

export default function SubcategoryGridScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const categoryId: string = route.params?.categoryId ?? 'manpower';
  const subcategories = SUBCATEGORIES[categoryId] ?? [];

  return (
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>
      {/* Category heading — dark navy */}
      <View
        style={{
          backgroundColor: '#101828',
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 20,
        }}
      >
        <Text style={{color: '#ffffff', fontSize: 20, fontWeight: '600'}}>
          {t(`demo:categories.${categoryId}`)}
        </Text>
        <Text style={{color: '#64748B', fontSize: 12, marginTop: 4}}>
          {t(`home.${categoryId}Subtitle`)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{padding: 16, paddingBottom: 40}}>
        {/* 2-column grid */}
        <View
          style={{
            flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              disabled={!sub.enabled}
              activeOpacity={sub.enabled ? 0.75 : 1}
              onPress={() => {
                navigation.navigate('SearchResults', {
                  category: categoryId,
                  params: {subcategoryId: sub.id},
                });
              }}
              style={[
                {
                  width: '47%',
                  aspectRatio: 1,
                  backgroundColor: sub.enabled ? '#FFFFFF' : '#F1F5F9',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  opacity: sub.enabled ? 1 : 0.65,
                  position: 'relative',
                  borderWidth: 1.5,
                  borderColor: sub.enabled ? '#E2E8F0' : 'transparent',
                },
                sub.enabled ? shadows.md : {},
              ]}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: sub.enabled ? '#FFF0D6' : '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={sub.icon as any}
                  size={30}
                  color={sub.enabled ? '#C9974A' : '#64748B'}
                />
              </View>

              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: sub.enabled ? '#101828' : '#64748B',
                  marginTop: 12,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {t(`demo:subcategories.${sub.id}`)}
              </Text>

              {/* Coming soon badge */}
              {!sub.enabled && (
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    end: 8,
                    backgroundColor: '#E67E3A',
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{color: '#FFFFFF', fontSize: 9, fontWeight: '600'}}>
                    {t('home.comingSoon')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
