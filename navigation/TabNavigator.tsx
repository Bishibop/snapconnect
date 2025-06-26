import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import {
  MainTabParamList,
  FriendsStackParamList,
  CameraStackParamList,
  InboxStackParamList,
  SentStackParamList,
} from '../types';
import { theme } from '../constants/theme';

// Import existing friends screens
import FriendsListScreen from '../screens/main/FriendsListScreen';
import AddFriendsScreen from '../screens/main/AddFriendsScreen';
import FriendRequestsScreen from '../screens/main/FriendRequestsScreen';

// Camera screens
import CameraScreen from '../screens/camera/CameraScreen';
import MediaPreview from '../screens/camera/MediaPreview';
import FriendSelectorScreen from '../screens/snaps/FriendSelectorScreen';

// Snap screens
import SnapInboxScreen from '../screens/snaps/SnapInboxScreen';
import SnapViewerScreen from '../screens/snaps/SnapViewerScreen';
import SentSnapsScreen from '../screens/snaps/SentSnapsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const FriendsStack = createStackNavigator<FriendsStackParamList>();
const CameraStack = createStackNavigator<CameraStackParamList>();
const InboxStack = createStackNavigator<InboxStackParamList>();
const SentStack = createStackNavigator<SentStackParamList>();

// Friends Stack Navigator
const FriendsStackNavigator = () => (
  <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
    <FriendsStack.Screen name="FriendsList" component={FriendsListScreen} />
    <FriendsStack.Screen name="AddFriends" component={AddFriendsScreen} />
    <FriendsStack.Screen name="FriendRequests" component={FriendRequestsScreen} />
    <FriendsStack.Screen name="SnapViewer" component={SnapViewerScreen} />
  </FriendsStack.Navigator>
);

// Camera Stack Navigator
const CameraStackNavigator = () => (
  <CameraStack.Navigator screenOptions={{ headerShown: false }}>
    <CameraStack.Screen name="CameraScreen" component={CameraScreen} />
    <CameraStack.Screen name="MediaPreview" component={MediaPreview} />
    <CameraStack.Screen name="FriendSelector" component={FriendSelectorScreen} />
  </CameraStack.Navigator>
);

// Inbox Stack Navigator
const InboxStackNavigator = () => (
  <InboxStack.Navigator screenOptions={{ headerShown: false }}>
    <InboxStack.Screen name="SnapInbox" component={SnapInboxScreen} />
    <InboxStack.Screen name="SnapViewer" component={SnapViewerScreen} />
  </InboxStack.Navigator>
);

// Sent Stack Navigator
const SentStackNavigator = () => (
  <SentStack.Navigator screenOptions={{ headerShown: false }}>
    <SentStack.Screen name="SentSnaps" component={SentSnapsScreen} />
    <SentStack.Screen name="SnapViewer" component={SnapViewerScreen} />
  </SentStack.Navigator>
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
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>👥</Text>,
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Friends' }],
              })
            );
          },
        })}
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
        component={InboxStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📥</Text>,
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Inbox' }],
              })
            );
          },
        })}
      />
      <Tab.Screen
        name="Sent"
        component={SentStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📤</Text>,
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Sent' }],
              })
            );
          },
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  cameraIcon: {
    borderWidth: 2,
    borderRadius: theme.borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
