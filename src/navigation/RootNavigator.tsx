import React from 'react';
import {View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
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
import Icon from '../components/common/Icon';

// Active RFQ count for tab badge
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
};

export type TabParamList = {
  Home: undefined;
  MyRFQs: undefined;
  MyJobs: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

interface TabIconProps {
  iconName: string;
  focused: boolean;
}

function TabIcon({iconName, focused}: TabIconProps) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 52,
      height: 44,
      borderRadius: 22,
      backgroundColor: focused ? 'rgba(26,26,46,0.88)' : 'transparent',
      shadowColor: focused ? '#1A1A2E' : 'transparent',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: focused ? 0.35 : 0,
      shadowRadius: 8,
    }}>
      <Icon
        name={iconName}
        size={22}
        color={focused ? '#FFFFFF' : '#1A1A2E'}
      />
    </View>
  );
}

function HomeTabs() {
  const rfqBadge = ACTIVE_RFQ_COUNT > 0 ? ACTIVE_RFQ_COUNT : undefined;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 24,
          right: 24,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(255,255,255,0.22)',
          borderWidth: 1.5,
          borderTopWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.55)',
          shadowColor: '#0F172A',
          shadowOffset: {width: 0, height: 12},
          shadowOpacity: 0.18,
          shadowRadius: 32,
          elevation: 20,
          paddingBottom: 0,
          paddingTop: 0,
          overflow: 'hidden',
        },
        tabBarActiveTintColor: '#1A1A2E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon iconName={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MyRFQs"
        component={MyRFQsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon iconName="file-document-outline" focused={focused} />
          ),
          tabBarBadge: rfqBadge,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
        }}
      />
      <Tab.Screen
        name="MyJobs"
        component={MyJobsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon iconName={focused ? 'briefcase' : 'briefcase-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon iconName={focused ? 'account' : 'account-outline'} focused={focused} />
          ),
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
        <Stack.Screen
          name="SubcategoryGrid"
          component={SubcategoryGridScreen}
          options={{
            headerShown: true,
            headerTitle: '',
            headerStyle: {backgroundColor: '#192433'},
            headerTintColor: '#FFFFFF',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
