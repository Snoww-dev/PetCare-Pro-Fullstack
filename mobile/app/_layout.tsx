import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Cấu hình thông báo (Giữ lại để App thông báo nổ "ting ting")
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 1. Màn hình Auth (Đăng nhập/Đăng ký) */}
        <Stack.Screen name="(auth)" />
        
        {/* 2. Màn hình Tabs (Menu chính: Home + Profile) */}
        <Stack.Screen name="(tabs)" />

        {/* 3. Các màn hình chức năng (Nằm đè lên Tabs) */}
        <Stack.Screen name="index" />
        <Stack.Screen name="add-pet" />
        <Stack.Screen name="pet-detail" />
        <Stack.Screen name="add-medical" />
        
        {/* Các màn hình dạng Modal (trượt từ dưới lên) */}
        <Stack.Screen name="qrcode" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-pet" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}