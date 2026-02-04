import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // 👈 Import thư viện ảnh
import { LinearGradient } from 'expo-linear-gradient';

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null); // Lưu ảnh hiển thị
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null); // Lưu ảnh mới chọn để upload
  const [loading, setLoading] = useState(false);

  // Link API cập nhật user (Bạn đã tạo ở bước trước)
  const API_URL = 'https://petcare-api-tuyet.onrender.com/api/users/me';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedAvatar = await AsyncStorage.getItem('userAvatar'); // Lấy avatar từ local

        setName(storedName || '');
        setEmail(storedEmail || '');
        setAvatar(storedAvatar || null);
    } catch (error) {
        console.log("Lỗi lấy data local", error);
    }
  };

  // 1. Hàm chọn ảnh từ thư viện
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Cho phép cắt ảnh vuông
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewAvatarUri(result.assets[0].uri); // Lưu URI tạm để hiển thị và upload
    }
  };

  // 2. Hàm lưu thay đổi
  const handleSave = async () => {
    if (!name.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập họ tên.");
        return;
    }

    setLoading(true);
    try {
        const token = await AsyncStorage.getItem('token');
        
        // Chuẩn bị FormData để gửi lên Server (bao gồm cả ảnh và tên)
        const formData = new FormData();
        formData.append('name', name);

        // Nếu có chọn ảnh mới thì mới gửi ảnh lên
        if (newAvatarUri) {
            // @ts-ignore
            formData.append('image', { // Lưu ý: Backend phải dùng uploadCloud.single('image') ở route user
                uri: newAvatarUri,
                type: 'image/jpeg',
                name: 'user-avatar.jpg',
            });
        }

        // Gọi API PUT
        // Lưu ý: Nếu backend chưa hỗ trợ upload ở route /users/me, 
        // code này sẽ chỉ cập nhật tên nếu bạn sửa backend rồi.
        // Tạm thời ta giả lập lưu LocalStorage cho mượt nhé.

        /* // --- ĐOẠN NÀY DÙNG KHI BACKEND HOÀN CHỈNH ---
        const response = await axios.put(API_URL, formData, {
             headers: { 
                 'Content-Type': 'multipart/form-data',
                 Authorization: `Bearer ${token}` 
             }
        });
        const updatedAvatarUrl = response.data.data.avatar;
        */

        // --- GIẢ LẬP LƯU LOCAL (Để App chạy được ngay) ---
        await AsyncStorage.setItem('userName', name);
        if (newAvatarUri) {
            await AsyncStorage.setItem('userAvatar', newAvatarUri);
        }

        Alert.alert("Thành công ✨", "Thông tin đã được cập nhật!");
        router.back(); // Quay lại trang Profile

    } catch (error) {
        console.log(error);
        Alert.alert("Lỗi", "Không thể cập nhật lúc này.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Header với Gradient nhẹ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Chỉnh sửa hồ sơ ✏️</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* Khu vực Avatar */}
        <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                <Image 
                    source={{ uri: newAvatarUri || avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} 
                    style={styles.avatar} 
                />
                <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={18} color="#fff" />
                </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Chạm để đổi ảnh đại diện</Text>
        </View>

        {/* Form nhập liệu */}
        <View style={styles.form}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#888" style={{marginRight: 10}} />
                <TextInput 
                    style={styles.input} 
                    value={name} 
                    onChangeText={setName} 
                    placeholder="Nhập tên của bạn"
                />
            </View>

            <Text style={styles.label}>Email (Không thể thay đổi)</Text>
            <View style={[styles.inputContainer, {backgroundColor: '#F5F5F5'}]}>
                <Ionicons name="mail-outline" size={20} color="#AAA" style={{marginRight: 10}} />
                <TextInput 
                    style={[styles.input, {color: '#999'}]} 
                    value={email} 
                    editable={false} 
                />
            </View>

            {/* Thêm trường Số điện thoại (Ví dụ) */}
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#888" style={{marginRight: 10}} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Thêm số điện thoại"
                    keyboardType="phone-pad"
                />
            </View>

            <TouchableOpacity onPress={handleSave} disabled={loading} style={{marginTop: 40}}>
                <LinearGradient colors={['#FF9A9E', '#FF6B81']} style={styles.btnSave}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>LƯU THAY ĐỔI</Text>}
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#fff', elevation: 2 },
  backBtn: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  avatarSection: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#FFF0F3' },
  cameraIcon: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#FF6B81', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  changePhotoText: { color: '#FF6B81', marginTop: 10, fontSize: 14, fontWeight: '500' },

  form: { paddingHorizontal: 25 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, marginTop: 20, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FAFAFA' },
  input: { flex: 1, fontSize: 16, color: '#333' },

  btnSave: { padding: 16, borderRadius: 15, alignItems: 'center', shadowColor: '#FF6B81', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});