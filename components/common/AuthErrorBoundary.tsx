import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface Props {
  children: ReactNode;
  onAuthError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
    
    // Handle specific auth errors
    if (this.isAuthError(error)) {
      this.props.onAuthError?.(error);
    }
  }

  private isAuthError = (error: Error): boolean => {
    const authErrorMessages = [
      'Missing Supabase environment variables',
      'Invalid login credentials',
      'User not found',
      'Email already registered',
      'Network request failed',
    ];
    
    // Handle case where error.message might be undefined
    if (!error.message) {
      return false;
    }
    
    return authErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Would you like to report this issue to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          onPress: () => {
            // In a real app, you'd send this to your error reporting service
            Alert.alert('Thanks!', 'Your report has been sent.');
          }
        }
      ]
    );
  };

  public render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error && this.isAuthError(this.state.error);
      
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {isAuthError ? 'Authentication Error' : 'Something went wrong'}
            </Text>
            <Text style={styles.message}>
              {isAuthError 
                ? 'There was a problem with authentication. Please check your connection and try again.'
                : this.state.error?.message || 'An unexpected error occurred'
              }
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={this.handleReset}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {!isAuthError && (
                <TouchableOpacity style={styles.secondaryButton} onPress={this.handleReportIssue}>
                  <Text style={styles.secondaryButtonText}>Report Issue</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFC00',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
});