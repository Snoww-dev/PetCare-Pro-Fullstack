import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      {/* Sau này có thêm register thì nó tự nhận luôn */}
    </Stack>
  );
}