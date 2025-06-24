import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { MainTabParamList, FriendsStackParamList, CameraStackParamList } from '../types';
import { theme } from '../constants/theme';

// Import existing friends screens
import FriendsListScreen from '../screens/main/FriendsListScreen';
import AddFriendsScreen from '../screens/main/AddFriendsScreen';
import FriendRequestsScreen from '../screens/main/FriendRequestsScreen';

// Camera screens
import CameraScreen from '../screens/camera/CameraScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const FriendsStack = createStackNavigator<FriendsStackParamList>();
const CameraStack = createStackNavigator<CameraStackParamList>();

// Placeholder component for inactive tabs
const ComingSoonScreen = ({ route }: any) => (
  <View style={styles.comingSoonContainer}>
    <Text style={styles.comingSoonTitle}>{route.name} Coming Soon</Text>
    <Text style={styles.comingSoonSubtitle}>This feature will be available in the next update</Text>
  </View>
);

// Friends Stack Navigator
const FriendsStackNavigator = () => (
  <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
    <FriendsStack.Screen name="FriendsList" component={FriendsListScreen} />
    <FriendsStack.Screen name="AddFriends" component={AddFriendsScreen} />
    <FriendsStack.Screen name="FriendRequests" component={FriendRequestsScreen} />
  </FriendsStack.Navigator>
);

// Camera Stack Navigator
const CameraStackNavigator = () => (
  <CameraStack.Navigator screenOptions={{ headerShown: false }}>
    <CameraStack.Screen name="CameraScreen" component={CameraScreen} />
  </CameraStack.Navigator>
);

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Camera"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.gray,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.lightGray,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Friends" 
        component={FriendsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={[styles.cameraIcon, { borderColor: color }]}>
              <Text style={{ color, fontSize: size - 4 }}>📸</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Inbox" 
        component={ComingSoonScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📥</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Sent" 
        component={ComingSoonScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  cameraIcon: {
    borderWidth: 2,
    borderRadius: theme.borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});