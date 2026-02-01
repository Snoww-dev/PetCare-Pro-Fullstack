import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B81',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
            paddingTop: 5,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 5
        }
      }}>
      
      {/* 1. Trang Chủ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />

      {/* 2. Dinh Dưỡng (MỚI THÊM) */}
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Dinh dưỡng',
          tabBarIcon: ({ color }) => <TabBarIcon name="restaurant" color={color} />,
        }}
      />

      {/* 3. Cá Nhân */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
        }}
      />

      {/* Ẩn các file khác */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}