import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setHasToken(!!token); // Có token là true, không là false
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Màn hình chờ màu hồng xoay xoay
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FECFEF' }}>
        <ActivityIndicator size="large" color="#FF6B81" />
      </View>
    );
  }

  // Nếu ĐÃ đăng nhập -> Vào khu Tabs (Có menu)
  if (hasToken) {
    return <Redirect href="/(tabs)" />;
  }

  // Nếu CHƯA đăng nhập -> Về trang Login
  return <Redirect href="/(auth)/login" />;
}