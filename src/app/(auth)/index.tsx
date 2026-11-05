import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../../context/auth-context';

export default function AuthIndex() {
  const { session } = useAuth();

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
