import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCreatedFirstVibeReel: boolean;
  hasTappedCamera: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  completeWelcome: () => void;
  completeFirstVibeReel: () => void;
  markCameraTapped: () => void;
}

const ONBOARDING_KEY = '@snapconnect_onboarding';

const defaultState: OnboardingState = {
  hasSeenWelcome: false,
  hasCreatedFirstVibeReel: false,
  hasTappedCamera: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>(defaultState);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const storedState = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (storedState) {
        setState(JSON.parse(storedState));
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }
  };

  const saveOnboardingState = async (newState: OnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  };

  const completeWelcome = () => {
    const newState = { ...state, hasSeenWelcome: true };
    saveOnboardingState(newState);
  };

  const completeFirstVibeReel = () => {
    const newState = { ...state, hasCreatedFirstVibeReel: true };
    saveOnboardingState(newState);
  };

  const markCameraTapped = () => {
    const newState = { ...state, hasTappedCamera: true };
    saveOnboardingState(newState);
  };


  const value: OnboardingContextType = {
    state,
    completeWelcome,
    completeFirstVibeReel,
    markCameraTapped,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
