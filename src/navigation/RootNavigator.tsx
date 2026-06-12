import React, {useEffect, useState} from 'react';
import {Keyboard, Text, TouchableOpacity, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import SubcategoryGridScreen from '../screens/SubcategoryGridScreen';
import SupplierProfileScreen from '../screens/SupplierProfileScreen';
import RFQFormScreen from '../screens/RFQFormScreen';
import RFQDetailScreen from '../screens/RFQDetailScreen';
import JobTrackingScreen from '../screens/JobTrackingScreen';
import ReviewScreen from '../screens/ReviewScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyRFQsScreen from '../screens/MyRFQsScreen';
import MyJobsScreen from '../screens/MyJobsScreen';
import RFQBroadcastScreen from '../screens/RFQBroadcastScreen';
import Icon from '../components/common/Icon';

const _rfqsAll: Array<{status: string}> = require('../../../shared/mock/rfqs.json');
const _ACTIVE_SET = new Set(['new', 'supplier_responded', 'negotiation', 'accepted', 'confirmed']);
const ACTIVE_RFQ_COUNT = _rfqsAll.filter(r => _ACTIVE_SET.has(r.status)).length;

export type RootStackParamList = {
  HomeTabs: undefined;
  SubcategoryGrid: {categoryId: string};
  SearchResults: {category: string; params: Record<string, unknown>};
  SupplierProfile: {supplierId: string};
  RFQForm: {category: string; params: Record<string, unknown>};
  RFQDetail: {rfqId: string};
  JobTracking: {jobId: string};
  Review: {jobId: string; supplierId: string};
  Notifications: undefined;
  MyRFQs: undefined;
  MyJobs: undefined;
  RFQBroadcast: {rfqId: string; supplierCount: number; city: string};
};

export type TabParamList = {
  Home: undefined;
  MyRFQs: undefined;
  MyJobs: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab icon + label config
const TAB_CONFIG: Record<
  string,
  {iconInactive: string; iconActive: string}
> = {
  Home:    {iconInactive: 'home-outline',           iconActive: 'home'},
  MyRFQs:  {iconInactive: 'file-document-outline',  iconActive: 'file-document-outline'},
  MyJobs:  {iconInactive: 'briefcase-outline',      iconActive: 'briefcase'},
  Profile: {iconInactive: 'account-outline',        iconActive: 'account'},
};

// ---------------------------------------------------------------------------
// Floating pill tab bar
// ---------------------------------------------------------------------------

function FloatingTabBar({state, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [keyboardShown, setKeyboardShown] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardShown(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardShown(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardShown) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: 12,
        paddingBottom: 16 + (insets.bottom || 0),
        backgroundColor: 'transparent',
      }}>
      {/* Inner pill */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingTop: 10,
          paddingBottom: 12,
        }}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const cfg = TAB_CONFIG[route.name] ?? TAB_CONFIG.Home;
          const iconName = focused ? cfg.iconActive : cfg.iconInactive;
          const isRFQs = route.name === 'MyRFQs';

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.7}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name as any);
                }
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {/* Icon + badge wrapper */}
              <View
                style={{
                  position: 'relative',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon
                  name={iconName as any}
                  size={21}
                  color={focused ? '#101828' : '#94A3B8'}
                />
                {/* RFQ notification badge */}
                {isRFQs && ACTIVE_RFQ_COUNT > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: 2,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: '#E67E3A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: '700',
                        color: '#FFFFFF',
                      }}>
                      {ACTIVE_RFQ_COUNT}
                    </Text>
                  </View>
                )}
              </View>
              {/* Active dot */}
              {focused && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: '#E67E3A',
                    marginTop: 3,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab navigator
// ---------------------------------------------------------------------------

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyRFQs" component={MyRFQsScreen} />
      <Tab.Screen name="MyJobs" component={MyJobsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        <Stack.Screen
          name="SubcategoryGrid"
          component={SubcategoryGridScreen}
          options={{
            headerShown: true,
            headerTitle: '',
            headerStyle: {backgroundColor: '#101828'},
            headerTintColor: '#ffffff',
            headerBackTitle: '',
          }}
        />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="SupplierProfile" component={SupplierProfileScreen} />
        <Stack.Screen name="RFQForm" component={RFQFormScreen} />
        <Stack.Screen name="RFQDetail" component={RFQDetailScreen} />
        <Stack.Screen name="JobTracking" component={JobTrackingScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="MyRFQs" component={MyRFQsScreen} />
        <Stack.Screen name="MyJobs" component={MyJobsScreen} />
        <Stack.Screen name="RFQBroadcast" component={RFQBroadcastScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
