import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import FriendsListScreen from '../screens/main/FriendsListScreen';
import AddFriendsScreen from '../screens/main/AddFriendsScreen';
import FriendRequestsScreen from '../screens/main/FriendRequestsScreen';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

const HomeScreen = ({ navigation }: any) => {
  const { signOut, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SnapConnect!</Text>
      <Text style={styles.subtitle}>Logged in as: {user?.email}</Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#FFFC00', marginBottom: 15 }]} 
        onPress={() => navigation.navigate('FriendsList')}
      >
        <Text style={[styles.buttonText, { color: '#000' }]}>Friends</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export const RootNavigator = () => {
  const { session } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFC00',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {session ? (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'SnapConnect' }}
            />
            <Stack.Screen 
              name="FriendsList" 
              component={FriendsListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AddFriends" 
              component={AddFriendsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="FriendRequests" 
              component={FriendRequestsScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
              options={{ 
                headerShown: true,
                title: '',
                headerStyle: {
                  backgroundColor: '#FFFC00',
                  elevation: 0,
                  shadowOpacity: 0,
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});