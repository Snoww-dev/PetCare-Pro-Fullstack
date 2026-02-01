import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// 👇 1. Import thư viện chọn ảnh
import * as ImagePicker from 'expo-image-picker';

export default function AddPetScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Các biến lưu dữ liệu
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Mèo');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('female');
  
  // 👇 2. Biến lưu ảnh tạm trên điện thoại
  const [pickedImage, setPickedImage] = useState<string | null>(null);

  // 👇 3. Hàm mở thư viện ảnh
  const pickImage = async () => {
    // Xin quyền truy cập
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Cần cấp quyền', 'Vui lòng cho phép App truy cập thư viện ảnh nhé!');
        return;
    }

    // Mở thư viện chọn ảnh
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Chỉ hiện ảnh
      allowsEditing: true, // Cho phép cắt cúp
      aspect: [1, 1], // Cắt hình vuông cho đẹp
      quality: 0.7, // Nén nhẹ cho upload nhanh
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0].uri); // Lưu đường dẫn ảnh vào biến
    }
  };

  const handleSave = async () => {
    // Kiểm tra nhập thiếu
    if (!name || !breed || !weight) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Tên, Giống loài và Cân nặng!');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      // ⚠️ Đổi IP Backend của bạn nếu cần
      const API_URL = 'https://petcare-api-tuyet.onrender.com/api/pets';

      // 👇 4. Đóng gói dữ liệu dạng FormData (để gửi kèm file)
      const formData = new FormData();
      formData.append('name', name);
      formData.append('species', species);
      formData.append('breed', breed);
      formData.append('weight', weight);
      formData.append('gender', gender);

      // Nếu có chọn ảnh, đóng gói file ảnh vào
      if (pickedImage) {
        const filename = pickedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename as string);
        const type = match ? `image/${match[1]}` : `image`;

        // @ts-ignore: React Native yêu cầu format này
        formData.append('image', { uri: pickedImage, name: filename, type });
      }

      // 5. Gửi lên Server
      await axios.post(API_URL, formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data', // Bắt buộc dòng này để Server hiểu là có file
        }
      });

      Alert.alert('Thành công 🎉', `Đã thêm bé ${name} và ảnh đại diện!`);
      router.back(); 

    } catch (error: any) {
      console.log('Lỗi upload:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể lưu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Component nút chọn (giữ nguyên)
  const OptionButton = ({ label, value, selectedValue, onSelect }: any) => (
    <TouchableOpacity 
      style={[styles.optionBtn, selectedValue === value && styles.optionBtnActive]} 
      onPress={() => onSelect(value)}
    >
      <Text style={[styles.optionText, selectedValue === value && styles.optionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thêm Thú Cưng</Text>
            <View style={{ width: 24 }} /> 
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.form}>
          
          {/* 👇 6. Khu vực bấm chọn ảnh mới */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
             {pickedImage ? (
                 <Image source={{ uri: pickedImage }} style={styles.previewImage} />
             ) : (
                 <View style={styles.imagePlaceholder}>
                     <Ionicons name="camera" size={40} color="#FF9A9E" />
                     <Text style={styles.imageText}>Chọn ảnh đại diện</Text>
                 </View>
             )}
          </TouchableOpacity>

          {/* Form nhập liệu (Giữ nguyên) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên bé cưng <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput style={styles.input} placeholder="Ví dụ: Mimi..." value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loài vật</Text>
            <View style={styles.row}>
              <OptionButton label="🐱 Mèo" value="Mèo" selectedValue={species} onSelect={setSpecies} />
              <OptionButton label="🐶 Chó" value="Chó" selectedValue={species} onSelect={setSpecies} />
              <OptionButton label="🐰 Khác" value="Khác" selectedValue={species} onSelect={setSpecies} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giống (Breed) <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput style={styles.input} placeholder="Ví dụ: Corgi..." value={breed} onChangeText={setBreed} />
          </View>

          <View style={styles.rowInput}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Cân nặng (kg) <Text style={{color: 'red'}}>*</Text></Text>
              <TextInput style={styles.input} placeholder="0.0" keyboardType="numeric" value={weight} onChangeText={setWeight} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Giới tính</Text>
              <View style={styles.row}>
                <OptionButton label="♂️ Đực" value="male" selectedValue={gender} onSelect={setGender} />
                <OptionButton label="♀️ Cái" value="female" selectedValue={gender} onSelect={setGender} />
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>LƯU HỒ SƠ 🐾</Text>}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backButton: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  form: { padding: 20 },
  
  // Style mới cho vùng chọn ảnh
  imagePicker: { alignItems: 'center', marginBottom: 20 },
  previewImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#FF9A9E' },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF0F3', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FF9A9E', borderStyle: 'dashed' },
  imageText: {color: '#FF9A9E', marginTop: 5, fontWeight: '600'},

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowInput: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  optionBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 3 },
  optionBtnActive: { backgroundColor: '#FFEDF0', borderColor: '#FF6B81' },
  optionText: { color: '#666', fontWeight: '500' },
  optionTextActive: { color: '#FF6B81', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#FF6B81', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, shadowColor: '#FF6B81', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  saveText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});