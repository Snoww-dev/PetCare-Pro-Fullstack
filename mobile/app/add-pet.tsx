import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
  const params = useLocalSearchParams();

  // STATE QUẢN LÝ LOẠI THÚ CƯNG
  const [selectedCategory, setSelectedCategory] = useState<string>('owned');

  useEffect(() => {
    if (params.category) {
        setSelectedCategory(params.category as string);
    }
  }, [params.category]);

  const [loading, setLoading] = useState(false);
  
  // Form dữ liệu
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  
  // 👇 THÊM STATE MÔ TẢ
  const [note, setNote] = useState('');
  
  const [imageUri, setImageUri] = useState<string | null>(null);

  const API_URL = 'https://petcare-api-tuyet.onrender.com/api'; 

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      
      // 👇 Bỏ width để tránh lỗi TypeScript, giảm quality xuống 0.5 cho nhẹ
      allowsMultipleSelection: false,
      quality: 0.5, 
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddPet = async () => {
    if (!name) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên thú cưng!');
      return;
    }
    if (!species) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập loài (VD: Chó, Mèo...)');
        return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      // Thông tin chung
      formData.append('name', name);
      formData.append('species', species);
      formData.append('category', selectedCategory);
      
      // 👇 Gửi thêm Mô tả (Note)
      formData.append('note', note);

      // Xử lý dữ liệu tùy theo loại
      if (selectedCategory === 'owned') {
          formData.append('breed', breed);
          formData.append('weight', weight);
          formData.append('gender', gender);
      } else {
          // Gửi giá trị mặc định cho "Đã gặp"
          formData.append('breed', 'Không rõ');
          formData.append('weight', '0'); 
          formData.append('gender', 'male'); 
      }

      // Ảnh
      if (imageUri) {
          // @ts-ignore
          formData.append('image', {
              uri: imageUri,
              type: 'image/jpeg',
              name: 'pet-avatar.jpg',
          });
      }

      // Gọi API
      await axios.post(`${API_URL}/pets`, formData, {
        headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}` 
        }
      });

      setLoading(false);
      Alert.alert('Thành công 🎉', 'Đã lưu thông tin thú cưng!');
      router.replace('/(tabs)');

    } catch (error) {
      setLoading(false);
      console.log("Lỗi thêm pet:", error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Server có thể đang khởi động, vui lòng thử lại!');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>Thêm Hồ Sơ Mới 📝</Text>

      {/* THANH CHỌN LOẠI */}
      <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, selectedCategory === 'owned' && styles.toggleBtnActive]}
            onPress={() => setSelectedCategory('owned')}
          >
             <Text style={[styles.toggleText, selectedCategory === 'owned' && styles.toggleTextActive]}>🏠 Đang nuôi</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toggleBtn, selectedCategory === 'encountered' && styles.toggleBtnActive]}
            onPress={() => setSelectedCategory('encountered')}
          >
             <Text style={[styles.toggleText, selectedCategory === 'encountered' && styles.toggleTextActive]}>📸 Đã gặp</Text>
          </TouchableOpacity>
      </View>

      {/* CHỌN ẢNH */}
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={pickImage}>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={{fontSize: 40}}>📸</Text>
                    <Text style={{color: '#999', marginTop: 5}}>Ảnh đại diện</Text>
                </View>
            )}
        </TouchableOpacity>
      </View>

      {/* INPUT DATA */}
      <Text style={styles.label}>Tên thú cưng (*)</Text>
      <TextInput style={styles.input} placeholder="VD: Miu, Lu..." value={name} onChangeText={setName} />

      <Text style={styles.label}>Loài (*)</Text>
      <TextInput style={styles.input} placeholder="VD: Chó, Mèo..." value={species} onChangeText={setSpecies} />

      {selectedCategory === 'owned' && (
        <View style={styles.advancedSection}>
            <Text style={styles.label}>Giống loài</Text>
            <TextInput style={styles.input} placeholder="VD: Poodle, Mèo Anh..." value={breed} onChangeText={setBreed} />

            <Text style={styles.label}>Cân nặng (kg)</Text>
            <TextInput style={styles.input} placeholder="VD: 5.5" keyboardType="numeric" value={weight} onChangeText={setWeight} />

            <Text style={styles.label}>Giới tính</Text>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
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
        </View>
      )}

      {/* 👇 PHẦN MÔ TẢ (HIỆN CHO CẢ 2 LOẠI) */}
      <Text style={styles.label}>Mô tả / Ghi chú thêm</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder={selectedCategory === 'owned' ? "VD: Bé thích ăn cá, hay ngủ ngày..." : "VD: Gặp ở công viên, rất thân thiện..."}
        value={note} 
        onChangeText={setNote}
        multiline={true}
        numberOfLines={4}
      />

      {/* BUTTON SUBMIT */}
      <TouchableOpacity style={styles.submitButton} onPress={handleAddPet} disabled={loading}>
        {loading ? (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.submitText, {marginLeft: 10}]}>Đang tải lên...</Text>
            </View>
        ) : (
            <Text style={styles.submitText}>LƯU LẠI ❤️</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={{ color: '#666' }}>Hủy bỏ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#ffffff', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 15, padding: 5, marginBottom: 25 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1 },
  toggleText: { fontSize: 16, color: '#999', fontWeight: '600' },
  toggleTextActive: { color: '#FF6B81', fontWeight: 'bold' },
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  imagePreview: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#FF8E9E' },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF0F3', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FF8E9E', borderStyle: 'dashed' },
  
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#FFF0F3', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16 },
  
  // Style riêng cho ô mô tả
  textArea: { height: 100, textAlignVertical: 'top' },

  advancedSection: { marginTop: 5 },
  genderBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FF8E9E', alignItems: 'center', marginHorizontal: 5 },
  genderBtnActive: { backgroundColor: '#FF8E9E' },
  genderText: { fontWeight: 'bold', color: '#FF8E9E' },
  submitButton: { backgroundColor: '#FF8E9E', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 20, marginBottom: 10, elevation: 3 },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  backButton: { alignItems: 'center', padding: 10 }
});