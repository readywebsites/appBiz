import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { EmeraldFlowingBackground } from '../src/components/EmeraldFlowingBackground';
import { colors } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <View style={styles.rootShell}>
          <EmeraldFlowingBackground variant="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/phone-login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/phone-verify" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/email-login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/email-verify" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
            <Stack.Screen name="(auth)/register" options={{ presentation: 'modal' }} />
            <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="service/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="package/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="enquiry" options={{ headerShown: false }} />
            <Stack.Screen name="consultation" options={{ headerShown: false }} />
            <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="my-services" options={{ headerShown: false }} />
            <Stack.Screen name="referrals" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="support/index" options={{ headerShown: false }} />
            <Stack.Screen name="support/new" options={{ headerShown: false }} />
            <Stack.Screen name="support/[id]" options={{ headerShown: false }} />
          </Stack>
        </View>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  rootShell: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
