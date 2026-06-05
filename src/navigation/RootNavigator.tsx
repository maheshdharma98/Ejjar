import React from 'react';
import {Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import SupplierProfileScreen from '../screens/SupplierProfileScreen';
import RFQFormScreen from '../screens/RFQFormScreen';
import RFQDetailScreen from '../screens/RFQDetailScreen';
import JobTrackingScreen from '../screens/JobTrackingScreen';
import ReviewScreen from '../screens/ReviewScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyRFQsScreen from '../screens/MyRFQsScreen';
import MyJobsScreen from '../screens/MyJobsScreen';

// Active RFQ count for tab badge — computed from static mock data
const _rfqsAll: Array<{status: string}> = require('../../../shared/mock/rfqs.json');
const _ACTIVE_SET = new Set(['new', 'supplier_responded', 'negotiation', 'accepted', 'confirmed']);
const ACTIVE_RFQ_COUNT = _rfqsAll.filter(r => _ACTIVE_SET.has(r.status)).length;

export type RootStackParamList = {
  HomeTabs: undefined;
  SearchResults: {category: string; params: Record<string, unknown>};
  SupplierProfile: {supplierId: string};
  RFQForm: {category: string; params: Record<string, unknown>};
  RFQDetail: {rfqId: string};
  JobTracking: {jobId: string};
  Review: {jobId: string; supplierId: string};
  Notifications: undefined;
  MyRFQs: undefined;
  MyJobs: undefined;
};

export type TabParamList = {
  Home: undefined;
  MyRFQs: undefined;
  MyJobs: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({emoji, focused}: {emoji: string; focused: boolean}) {
  return (
    <View style={{alignItems: 'center', paddingTop: 2}}>
      {/* Indicator pill above the icon */}
      <View
        style={{
          width: 20,
          height: 3,
          borderRadius: 2,
          backgroundColor: focused ? '#1A4FBA' : 'transparent',
          marginBottom: 3,
        }}
      />
      <Text style={{fontSize: 22}}>{emoji}</Text>
    </View>
  );
}

function TabLabel({label, focused}: {label: string; focused: boolean}) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: focused ? '600' : '400',
        color: focused ? '#1A4FBA' : '#9CA3AF',
        marginBottom: 4,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );
}

function HomeTabs() {
  // My RFQs tab badge = active RFQ count; bell badge on HomeScreen uses appStore.unreadCount
  const rfqBadge = ACTIVE_RFQ_COUNT > 0 ? ACTIVE_RFQ_COUNT : undefined;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 64,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#1A4FBA',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon emoji="🏠" focused={focused} />,
          tabBarLabel: ({focused}) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyRFQs"
        component={MyRFQsScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon emoji="📋" focused={focused} />,
          tabBarLabel: ({focused}) => <TabLabel label="My RFQs" focused={focused} />,
          tabBarBadge: rfqBadge,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontSize: 10,
          },
        }}
      />
      <Tab.Screen
        name="MyJobs"
        component={MyJobsScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon emoji="💼" focused={focused} />,
          tabBarLabel: ({focused}) => <TabLabel label="My Jobs" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon emoji="👤" focused={focused} />,
          tabBarLabel: ({focused}) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="SupplierProfile" component={SupplierProfileScreen} />
        <Stack.Screen name="RFQForm" component={RFQFormScreen} />
        <Stack.Screen name="RFQDetail" component={RFQDetailScreen} />
        <Stack.Screen name="JobTracking" component={JobTrackingScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="MyRFQs" component={MyRFQsScreen} />
        <Stack.Screen name="MyJobs" component={MyJobsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
