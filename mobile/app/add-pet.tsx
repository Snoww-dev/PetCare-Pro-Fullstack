import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker'; // 👈 Thư viện chọn ảnh
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function AddPetScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form dữ liệu
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  
  // Xử lý ảnh
  const [imageUri, setImageUri] = useState<string | null>(null); // Link ảnh trên máy (để xem trước)

  // ⚠️ IP CỦA BẠN (Kiểm tra kỹ nhé)
  const API_URL = 'https://petcare-api-tuyet.onrender.com/api'; 

  // 1. Hàm mở thư viện chọn ảnh
  const pickImage = async () => {
    // Xin quyền truy cập thư viện
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Chỉ lấy ảnh
      allowsEditing: true, // Cho phép cắt ảnh
      aspect: [1, 1], // Cắt hình vuông cho đẹp
      quality: 0.5, // Giảm chất lượng chút cho nhẹ Server
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // Lưu link ảnh tạm để hiển thị
    }
  };

  // 2. Hàm upload ảnh lên Server
  const uploadImageToServer = async () => {
    if (!imageUri) return null; // Nếu không chọn ảnh thì thôi

    const formData = new FormData();
    // ⚠️ React Native quy định gửi file phải đúng format này
    formData.append('image', {
      uri: imageUri,
      name: 'pet_photo.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        },
      });
      return response.data.imageUrl; // Trả về link ảnh online (Cloudinary)
    } catch (error) {
      console.log('Lỗi upload ảnh:', error);
      Alert.alert('Lỗi', 'Không thể tải ảnh lên.');
      return null;
    }
  };

  // 3. Hàm Lưu tất cả (Lưu ảnh trước -> Lấy link -> Lưu thông tin Pet)
  const handleAddPet = async () => {
    if (!name || !species) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và loài!');
      return;
    }

    setLoading(true);

    try {
      // BƯỚC 1: Upload ảnh trước (nếu có)
      let finalImgUrl = '';
      if (imageUri) {
        finalImgUrl = await uploadImageToServer();
        if (!finalImgUrl) {
            setLoading(false);
            return; // Nếu lỗi upload thì dừng luôn
        }
      }

      // BƯỚC 2: Gửi thông tin Pet kèm link ảnh vừa có
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/pets`, {
        name,
        species,
        breed,
        weight: Number(weight),
        gender,
        img_url: finalImgUrl // 👈 Lưu link ảnh thật vào đây
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLoading(false);
      Alert.alert('Thành công 🎉', 'Đã thêm thú cưng mới!');
      router.replace('/(tabs)');

    } catch (error) {
      setLoading(false);
      console.log("Lỗi thêm pet:", error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Thêm Thú Cưng Mới 🐾</Text>

      {/* --- KHUNG CHỌN ẢNH --- */}
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={pickImage}>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={{fontSize: 40}}>📸</Text>
                    <Text style={{color: '#999', marginTop: 5}}>Chọn ảnh đại diện</Text>
                </View>
            )}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Tên thú cưng (*)</Text>
      <TextInput style={styles.input} placeholder="VD: Miu, Lu..." value={name} onChangeText={setName} />

      <Text style={styles.label}>Loài (*)</Text>
      <TextInput style={styles.input} placeholder="VD: Chó, Mèo..." value={species} onChangeText={setSpecies} />

      <Text style={styles.label}>Giống loài</Text>
      <TextInput style={styles.input} placeholder="VD: Poodle, Mèo Anh..." value={breed} onChangeText={setBreed} />

      <Text style={styles.label}>Cân nặng (kg)</Text>
      <TextInput style={styles.input} placeholder="VD: 5.5" keyboardType="numeric" value={weight} onChangeText={setWeight} />

      <Text style={styles.label}>Giới tính</Text>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <TouchableOpacity 
            style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]} 
            onPress={() => setGender('male')}>
            <Text style={[styles.genderText, gender === 'male' && {color: '#fff'}]}>♂️ Đực</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]} 
            onPress={() => setGender('female')}>
            <Text style={[styles.genderText, gender === 'female' && {color: '#fff'}]}>♀️ Cái</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleAddPet} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>LƯU HỒ SƠ ❤️</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: '#666' }}>Hủy bỏ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#ffffff', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF8E9E', marginBottom: 20, textAlign: 'center' },
  
  // Style cho ảnh
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  imagePreview: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#FF8E9E' },
  imagePlaceholder: { 
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF0F3', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FF8E9E', borderStyle: 'dashed'
  },

  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 },
  input: { backgroundColor: '#FFF0F3', borderRadius: 10, padding: 12, marginBottom: 15 },
  
  genderBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FF8E9E', alignItems: 'center', marginHorizontal: 5 },
  genderBtnActive: { backgroundColor: '#FF8E9E' },
  genderText: { fontWeight: 'bold', color: '#FF8E9E' },

  submitButton: { backgroundColor: '#FF8E9E', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  backButton: { alignItems: 'center', padding: 10 }
});