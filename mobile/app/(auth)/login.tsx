import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Image // 👈 Đã thêm import Image
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  // ⚠️ API Online (Không cần sửa)
  const API_URL = 'https://petcare-api-tuyet.onrender.com/api/auth/login';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Chưa nhập đủ', 'Vui lòng điền Email và Mật khẩu nhé!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API_URL, {
        email: email,
        password: password
      });

      // 1. Lưu token vào két sắt
      await AsyncStorage.setItem('token', response.data.token);
      
      // 💡 Mẹo nhỏ: Lưu luôn email để tí nữa qua trang Profile hiển thị cho đẹp
      await AsyncStorage.setItem('userEmail', email); 
      
      setLoading(false);

      // 👇 QUAN TRỌNG: Chuyển hướng sang '(tabs)' thay vì '/home'
      // Vì giờ nhà mới của mình là thư mục (tabs)
      router.replace('/(tabs)' as any); 

    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.message || 'Không kết nối được server!';
      Alert.alert('Đăng nhập thất bại 😢', message);
    }
  };

  return (
    // Dùng KeyboardAvoidingView để bàn phím không che mất nút bấm
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* 1. Logo hoặc Icon trang trí */}
        <View style={styles.header}>
          
          {/* 👇 ĐÃ SỬA: Thay icon 🐾 bằng Logo của bạn */}
          <Image 
             source={require('../../assets/images/logo.png')} 
             style={styles.logo}
          />

          <Text style={styles.title}>Pet Manager</Text>
          <Text style={styles.subtitle}>Chăm sóc thú cưng bằng cả trái tim</Text>
        </View>

        {/* 2. Form đăng nhập */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ví dụ: tuyet@gmail.com"
              placeholderTextColor="#F4AAB6"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput 
              style={styles.input}
              placeholder="••••••"
              placeholderTextColor="#F4AAB6"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* 3. Nút CTA */}
          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>ĐĂNG NHẬP NGAY</Text>
            )}
          </TouchableOpacity>

          {/* 4. Link phụ & Đăng ký */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Alert.alert("Tính năng đang phát triển", "Bạn hãy thử nhớ lại xem ^^")}>
              <Text style={styles.linkText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
                <Text style={{ color: '#666' }}>Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                    <Text style={[styles.linkText, { fontWeight: 'bold' }]}>Đăng ký ngay</Text>
                </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    padding: 24,
  },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
  
  // 👇 Style cho Logo mới
  logo: { 
    width: 150, 
    height: 150, 
    resizeMode: 'contain', 
    marginBottom: 10 
  },

  title: { fontSize: 32, fontWeight: 'bold', color: '#FF8E9E' },
  subtitle: { fontSize: 16, color: '#4A4A4A', marginTop: 5 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333333', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FDEBED',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#333333',
  },
  button: {
    backgroundColor: '#FF8E9E',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FF8E9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 10,
  },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  
  footerLinks: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#FF8E9E' },
  registerContainer: { flexDirection: 'row', marginTop: 15 }
});