import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Boxes, FolderKanban, ShoppingBag, User } from 'lucide-react-native';
import { colors } from '../../src/theme';
import { EmeraldFlowingBackground } from '../../src/components/EmeraldFlowingBackground';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <EmeraldFlowingBackground variant="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarActiveTintColor: '#6EE7B7',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: colors.glass.tabBar,
            borderTopWidth: 1,
            borderTopColor: colors.glass.borderLight,
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 8,
            shadowColor: '#01150F',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                } as any)
              : {}),
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: 'Services',
            tabBarIcon: ({ color, size }) => <Boxes size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: 'My Projects',
            tabBarIcon: ({ color, size }) => <FolderKanban size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => <ShoppingBag size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
