import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import AuthForm from '../../components/ui/AuthForm';
import FormInput from '../../components/ui/FormInput';
import ActionButton from '../../components/ui/ActionButton';

export const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { signUp, loading } = useAuth();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const handleSignup = async () => {
    if (!email || !password || !username) {
      return;
    }
    await signUp(email, password, username);
  };

  return (
    <AuthForm title="Join SnapConnect">
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

      <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </AuthForm>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  linkText: {
    textAlign: 'center',
    color: '#000',
    fontSize: 16,
  },
});
