import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  Image, 
  ScrollView, 
  StatusBar,
  RefreshControl, 
  ActivityIndicator
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function ProfileScreen() {
  const router = useRouter();
  
  // 👇 SỬA LỖI TYPESCRIPT: Khai báo rõ kiểu dữ liệu cho state
  const [userInfo, setUserInfo] = useState<{
      name: string;
      email: string;
      avatar: string | null; // Cho phép vừa là chữ, vừa là null
  }>({ 
      name: 'Người dùng', 
      email: 'loading...', 
      avatar: null 
  });

  // 👇 State lưu số liệu thật
  const [stats, setStats] = useState({
      petCount: 0,
      monthsJoined: 0,
      photoCount: 0
  });

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
        fetchRealData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRealData().then(() => setRefreshing(false));
  }, []);

  const fetchRealData = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        
        // 1. Lấy thông tin hiển thị cơ bản từ Local
        const email = await AsyncStorage.getItem('userEmail') || 'user@example.com'; 
        const name = await AsyncStorage.getItem('userName') || 'Sen Chăm Chỉ';
        const avatar = await AsyncStorage.getItem('userAvatar'); 
        setUserInfo({ name, email, avatar });

        if (!token) return;

        // 2. GỌI API LẤY SỐ LIỆU THẬT
        
        // API User -> Tính tháng tham gia
        const userRes = await axios.get('https://petcare-api-tuyet.onrender.com/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const createdAt = userRes.data.data.createdAt ? new Date(userRes.data.data.createdAt) : new Date();
        const now = new Date();
        let diffMonths = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth());
        if (diffMonths < 1) diffMonths = 1;

        // API Pets -> Đếm thú cưng & Ảnh
        const petsRes = await axios.get('https://petcare-api-tuyet.onrender.com/api/pets', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const pets = petsRes.data.data || [];
        
        let totalPhotos = 0;
        pets.forEach((p: any) => {
            if (p.gallery) totalPhotos += p.gallery.length;
        });

        setStats({
            petCount: pets.length,
            monthsJoined: diffMonths,
            photoCount: totalPhotos
        });

    } catch (error) {
        console.log("Lỗi lấy dữ liệu:", error);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn thoát?', [
      { text: 'Huỷ', style: 'cancel' },
      { 
        text: 'Đồng ý', 
        style: 'destructive',
        onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('userName');
            await AsyncStorage.removeItem('userAvatar');
            router.replace('/(auth)/login' as any);
        } 
      }
    ]);
  };

  const MenuItem = ({ icon, color, label, onPress, isLast = false }: any) => (
    <TouchableOpacity 
        style={[styles.menuItem, isLast && styles.menuItemLast]} 
        onPress={onPress}
    >
        <View style={[styles.iconBox, { backgroundColor: color }]}>
            <Ionicons name={icon} size={18} color="#fff" />
        </View>
        <Text style={styles.menuText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color="#ddd" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. HEADER & CARD */}
      <View style={styles.topSection}>
        <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.headerGradient} />
        
        <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
                <Image 
                    source={{ uri: userInfo.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} 
                    style={styles.avatar} 
                />
                <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={12} color="#fff" />
                </View>
            </View>
            
            <View style={styles.infoWrapper}>
                <Text style={styles.userName}>{userInfo.name}</Text>
                <Text style={styles.userEmail}>{userInfo.email}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Thành viên Vàng 👑</Text>
                </View>
            </View>

            {/* SỐ LIỆU THỐNG KÊ (ĐÃ FIX LOGIC) */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.petCount}</Text>
                    <Text style={styles.statLabel}>Thú cưng</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.monthsJoined}</Text>
                    <Text style={styles.statLabel}>Tháng</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.photoCount}</Text>
                    <Text style={styles.statLabel}>Ảnh</Text>
                </View>
            </View>
        </View>
      </View>

      {/* 2. MENU OPTIONS */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.menuContainer}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B81']} />
        }
      >
        <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
        <View style={styles.menuGroup}>
            <MenuItem 
                icon="person" color="#5C6BC0" 
                label="Chỉnh sửa thông tin" 
                onPress={() => router.push('/edit-profile' as any)} 
            />
            <MenuItem 
                icon="settings" color="#26A69A" 
                label="Cài đặt ứng dụng" 
                onPress={() => router.push('/settings' as any)} 
                isLast
            />
        </View>

        <Text style={styles.sectionTitle}>KHÁC</Text>
        <View style={styles.menuGroup}>
            <MenuItem 
                icon="help-circle" color="#FFA726" 
                label="Trợ giúp & Hỗ trợ" 
                onPress={() => router.push('/help' as any)} 
                isLast
            />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Phiên bản 1.0.0 - PetCare Pro</Text>
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  topSection: { marginBottom: 20 },
  headerGradient: { height: 180, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  profileCard: {
    marginHorizontal: 20, marginTop: -80, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5
  },
  avatarWrapper: { position: 'relative', marginBottom: 10, marginTop: -50 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF6B81', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  infoWrapper: { alignItems: 'center', marginBottom: 20 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#888', marginBottom: 8 },
  badge: { backgroundColor: '#FFF9C4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#FBC02D', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 15 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  statDivider: { width: 1, height: '80%', backgroundColor: '#F0F0F0' },
  menuContainer: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#AAA', marginBottom: 10, marginLeft: 10, marginTop: 10 },
  menuGroup: { backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F5F7FA' },
  menuItemLast: { borderBottomWidth: 0 },
  iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#FFEBEE', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },
  version: { textAlign: 'center', color: '#CCC', marginTop: 30, fontSize: 12 }
});