import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import AuthForm from '../../components/ui/AuthForm';
import FormInput from '../../components/ui/FormInput';
import ActionButton from '../../components/ui/ActionButton';

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
        style={styles.signupButton}
      >
        <Text style={styles.signupText}>Sign Up</Text>
      </TouchableOpacity>
    </AuthForm>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  signupButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  signupText: {
    textAlign: 'center',
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});
