import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form Data
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // API Đăng ký (Dùng chung domain với Login)
  const API_URL = 'https://petcare-api-tuyet.onrender.com/api/auth/register';

  const handleRegister = async () => {
    // 1. Kiểm tra dữ liệu đầu vào
    if (!displayName || !email || !password || !phone) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các mục nhé!');
      return;
    }

    setLoading(true);

    try {
      // 2. Gọi API đăng ký
      // Lưu ý: Key phải khớp chính xác với Backend (auth.controller.js)
      const response = await axios.post(API_URL, {
        display_name: displayName,
        email: email,
        password: password,
        phone: phone
      });

      setLoading(false);

      // 3. Thông báo & Chuyển về trang Login
      Alert.alert(
        'Đăng ký thành công! 🎉', 
        'Tài khoản của bạn đã sẵn sàng. Hãy đăng nhập ngay nhé!',
        [
          { text: 'Về Đăng Nhập', onPress: () => router.back() } 
        ]
      );

    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!';
      Alert.alert('Đăng ký thất bại 😢', message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Nút Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color="#FF6B81" />
        </TouchableOpacity>

        {/* Header Logo */}
        <View style={styles.header}>
            <Image 
               // Dùng chung logo với màn hình Login
               source={require('../../assets/images/logo.png')} 
               style={styles.logo}
            />
            <Text style={styles.title}>Tạo Tài Khoản</Text>
            <Text style={styles.subtitle}>Gia nhập cộng đồng yêu thú cưng</Text>
        </View>

        {/* Form Nhập liệu */}
        <View style={styles.form}>
            
            <Text style={styles.label}>Tên hiển thị (*)</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Ví dụ: Mẹ Tuyết"
                value={displayName}
                onChangeText={setDisplayName}
            />

            <Text style={styles.label}>Email (*)</Text>
            <TextInput 
                style={styles.input} 
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput 
                style={styles.input} 
                placeholder="0909xxxxxx"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
            />

            <Text style={styles.label}>Mật khẩu (*)</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Tối thiểu 6 ký tự"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {/* Nút Đăng Ký */}
            <TouchableOpacity onPress={handleRegister} disabled={loading} style={{marginTop: 20}}>
                <LinearGradient 
                    colors={['#FF9A9E', '#FF6B81']} 
                    style={styles.button}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>ĐĂNG KÝ NGAY ✨</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={{color: '#666'}}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.linkText}>Đăng nhập</Text>
                </TouchableOpacity>
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
    padding: 24,
    justifyContent: 'center'
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: '#FFF0F3',
    padding: 8,
    borderRadius: 12
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B81',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: '#999'
  },
  form: {
    width: '100%'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 5
  },
  input: {
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FDEBED',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 10
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 20
  },
  linkText: {
    color: '#FF6B81',
    fontWeight: 'bold'
  }
});