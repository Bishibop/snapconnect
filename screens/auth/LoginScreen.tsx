import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import AuthForm from '../../components/ui/AuthForm';
import FormInput from '../../components/ui/FormInput';
import ActionButton from '../../components/ui/ActionButton';
import { theme } from '../../constants/theme';

const VibeReelSignInImage = require('../../assets/images/VibeReelSignIn.jpeg');

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }
    await signIn(email, password);
  };

  return (
    <AuthForm titleImage={VibeReelSignInImage}>
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
        title="Login"
        onPress={handleLogin}
        loading={loading}
        fullWidth
        style={styles.button}
      />

      <TouchableOpacity 
        onPress={() => navigation.navigate('Signup')} 
        disabled={loading}
        style={styles.signupLink}
      >
        <Text style={styles.signupText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </AuthForm>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  signupLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signupText: {
    textAlign: 'center',
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
