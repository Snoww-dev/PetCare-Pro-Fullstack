import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function ProfileScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ name: 'Người dùng', email: 'loading...' });
  
  // Lấy thông tin người dùng (Giả lập từ token hoặc gọi API user/me nếu bạn đã viết)
  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    // Tạm thời mình lấy tên mặc định, sau này bạn có thể gọi API user details
    const email = await AsyncStorage.getItem('userEmail') || 'user@example.com'; 
    // Nếu lúc login bạn có lưu tên thì lấy ra, không thì để mặc định
    setUserInfo({ name: 'Sen Chăm Chỉ', email: email });
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn thoát?', [
      { text: 'Huỷ', style: 'cancel' },
      { 
        text: 'Đồng ý', 
        style: 'destructive',
        onPress: async () => {
            // 1. Xóa token
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('userEmail');
            
            // 2. Đá về trang Login (replace để không back lại được)
            router.replace('/(auth)/login' as any);
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header cong đẹp mắt */}
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.headerGradient} />
        <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
                <Image 
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} 
                    style={styles.avatar} 
                />
                <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={14} color="#fff" />
                </View>
            </View>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        
        <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="person" size={20} color="#2196F3" />
            </View>
            <Text style={styles.menuText}>Chỉnh sửa thông tin</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="settings" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.menuText}>Cài đặt ứng dụng</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="help-circle" size={20} color="#FF9800" />
            </View>
            <Text style={styles.menuText}>Trợ giúp & Hỗ trợ</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Nút Đăng xuất */}
        <TouchableOpacity style={[styles.menuItem, { marginTop: 20 }]} onPress={handleLogout}>
            <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="log-out" size={20} color="#F44336" />
            </View>
            <Text style={[styles.menuText, { color: '#F44336' }]}>Đăng xuất</Text>
        </TouchableOpacity>

      </View>
      
      <Text style={styles.version}>Phiên bản 1.0.0 - PetCare Pro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  headerContainer: { height: 250, marginBottom: 20 },
  headerGradient: { position: 'absolute', width: '100%', height: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  
  profileSection: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF6B81', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 5 },

  menuContainer: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },

  version: { textAlign: 'center', color: '#bbb', marginTop: 30, fontSize: 12 }
});