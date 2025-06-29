import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import AuthForm from '../../components/ui/AuthForm';
import FormInput from '../../components/ui/FormInput';
import ActionButton from '../../components/ui/ActionButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VibeReelSignInImage = require('../../assets/images/VibeReelSignIn.jpeg');

export const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { signUp, loading } = useAuth();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();

  const handleSignup = async () => {
    if (!email || !password || !username) {
      return;
    }
    await signUp(email, password, username);
  };

  return (
    <>
      <AuthForm titleImage={VibeReelSignInImage} style={styles.authForm}>
        <FormInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <FormInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <FormInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <ActionButton
          title="Sign Up"
          onPress={handleSignup}
          loading={loading}
          fullWidth
          style={styles.button}
        />
      </AuthForm>

      <View style={[styles.backButtonContainer, { top: insets.top + 10 }]}>
        <ActionButton
          title="← Login"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="small"
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  authForm: {
    paddingTop: 40, // Adjust this value to align with login page
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 10,
  },
});
