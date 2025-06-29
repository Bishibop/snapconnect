import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import {
  MainTabParamList,
  FriendsStackParamList,
  CameraStackParamList,
  ConversationsStackParamList,
  ProfileStackParamList,
} from '../types';
import { theme } from '../constants/theme';
import Icon from '../components/ui/Icon';

// Import existing friends screens
import FriendsListScreen from '../screens/main/FriendsListScreen';
import AddFriendsScreen from '../screens/main/AddFriendsScreen';
import FriendRequestsScreen from '../screens/main/FriendRequestsScreen';

// Camera screens
import CameraScreen from '../screens/camera/CameraScreen';
import MediaPreview from '../screens/camera/MediaPreview';
import FriendSelectorScreen from '../screens/vibeChecks/FriendSelectorScreen';

// VibeReel screens
import CreateVibeReel from '../screens/VibeReel/CreateVibeReel';
import VibeReelPreview from '../screens/VibeReel/VibeReelPreview';
import VibeReelPlayer from '../screens/VibeReel/VibeReelPlayer';

// VibeCheck screens
import VibeCheckViewerScreen from '../screens/vibeChecks/VibeCheckViewerScreen';

// Conversations screens
import ConversationsListScreen from '../screens/conversations/ConversationsListScreen';
import ConversationDetailScreen from '../screens/conversations/ConversationDetailScreen';

// Profile screens
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfile from '../screens/Profile/EditProfile';

const Tab = createBottomTabNavigator<MainTabParamList>();
const FriendsStack = createStackNavigator<FriendsStackParamList>();
const CameraStack = createStackNavigator<CameraStackParamList>();
const ConversationsStack = createStackNavigator<ConversationsStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Friends Stack Navigator
const FriendsStackNavigator = () => (
  <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
    <FriendsStack.Screen name="FriendsList" component={FriendsListScreen} />
    <FriendsStack.Screen name="AddFriends" component={AddFriendsScreen} />
    <FriendsStack.Screen name="FriendRequests" component={FriendRequestsScreen} />
    <FriendsStack.Screen name="VibeReelPlayer" component={VibeReelPlayer} />
    <FriendsStack.Screen name="VibeCheckViewer" component={VibeCheckViewerScreen} />
  </FriendsStack.Navigator>
);

// Camera Stack Navigator
const CameraStackNavigator = () => (
  <CameraStack.Navigator screenOptions={{ headerShown: false }}>
    <CameraStack.Screen name="CameraScreen" component={CameraScreen} />
    <CameraStack.Screen name="MediaPreview" component={MediaPreview} />
    <CameraStack.Screen name="FriendSelector" component={FriendSelectorScreen} />
    <CameraStack.Screen name="CreateVibeReel" component={CreateVibeReel} />
    <CameraStack.Screen name="VibeReelPreview" component={VibeReelPreview} />
    <CameraStack.Screen name="VibeReelPlayer" component={VibeReelPlayer} />
  </CameraStack.Navigator>
);

// Conversations Stack Navigator
const ConversationsStackNavigator = () => (
  <ConversationsStack.Navigator screenOptions={{ headerShown: false }}>
    <ConversationsStack.Screen name="ConversationsList" component={ConversationsListScreen} />
    <ConversationsStack.Screen name="ConversationDetail" component={ConversationDetailScreen} />
    <ConversationsStack.Screen name="VibeCheckViewer" component={VibeCheckViewerScreen} />
  </ConversationsStack.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfile} />
  </ProfileStack.Navigator>
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
          tabBarIcon: ({ color, size }) => <Icon name="FRIENDS" color={color} size={size} />,
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
              <Icon name="CAMERA" color={color} size={size - 4} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Conversations"
        component={ConversationsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="COMMENT" color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Conversations' }],
              })
            );
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="USER" color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Profile' }],
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
