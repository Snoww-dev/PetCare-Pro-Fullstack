import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams(); // Lấy ID từ trang chi tiết
  const router = useRouter();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [image, setImage] = useState<string | null>(null); // Ảnh mới chọn từ máy
  const [currentImage, setCurrentImage] = useState<string | null>(null); // Ảnh cũ trên server
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Link API
  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${id}`;

  useEffect(() => {
    fetchPetDetail();
  }, [id]);

  // 1. Lấy thông tin cũ điền vào form
  const fetchPetDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pet = response.data.data;
      
      setName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed || '');
      setAge(pet.age ? String(pet.age) : '');
      setWeight(pet.weight ? String(pet.weight) : '');
      setGender(pet.gender);
      setCurrentImage(pet.img_url);
      setLoading(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không lấy được thông tin thú cưng');
      router.back();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri); // Lưu ảnh mới vào state
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      formData.append('name', name);
      formData.append('species', species);
      formData.append('breed', breed);
      formData.append('age', age);
      formData.append('weight', weight);
      formData.append('gender', gender);

      // Nếu có chọn ảnh mới thì gửi lên, không thì thôi
      if (image) {
        // @ts-ignore
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: 'updated-pet.jpg',
        });
      }

      await axios.put(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('Thành công! ✨', 'Thông tin bé đã được cập nhật.');
      router.replace('/home' as any); // Quay về Home để refresh dữ liệu

    } catch (error) {
      console.log('Update lỗi:', error);
      Alert.alert('Lỗi', 'Không cập nhật được lúc này.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <View style={styles.loadingCenter}>
      <ActivityIndicator size="large" color="#FF8E9E" />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.headerBackground} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{fontSize: 20}}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh Sửa Hồ Sơ ✏️</Text>
      </View>

      <Animatable.View animation="fadeInUp" duration={800} style={styles.formContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* Khu vực ảnh: Ưu tiên hiển thị ảnh mới chọn, nếu không có thì hiện ảnh cũ */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            <Image 
              source={{ uri: image || currentImage || 'https://cdn-icons-png.flaticon.com/512/616/616408.png' }} 
              style={styles.previewImage} 
            />
            <View style={styles.editIconContainer}>
              <Text>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.label}>Tên bé cưng</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Loài</Text>
              <TextInput style={styles.input} value={species} onChangeText={setSpecies} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Giống</Text>
              <TextInput style={styles.input} value={breed} onChangeText={setBreed} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Cân nặng (kg)</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Tuổi</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} />
            </View>
          </View>

          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]} onPress={() => setGender('male')}>
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>♂️ Đực</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]} onPress={() => setGender('female')}>
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>♀️ Cái</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleUpdate} disabled={updating} style={{ marginTop: 30, marginBottom: 50 }}>
            <LinearGradient colors={['#FF9A9E', '#FF6B81']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.submitBtn}>
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>LƯU THAY ĐỔI ✅</Text>}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FECFEF' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBackground: { height: 150, width: '100%', position: 'absolute', top: 0 },
  header: { marginTop: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.5)', padding: 8, borderRadius: 15, marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

  formContainer: { flex: 1, backgroundColor: '#fff', marginTop: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 10 },
  
  imagePicker: { alignSelf: 'center', width: 120, height: 120, marginBottom: 20 },
  previewImage: { width: '100%', height: '100%', borderRadius: 60, borderWidth: 3, borderColor: '#FF9A9E' },
  editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 3 },

  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 5 },
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 12, fontSize: 16, color: '#333', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  genderContainer: { flexDirection: 'row', marginTop: 5 },
  genderBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', alignItems: 'center', marginHorizontal: 5, backgroundColor: '#FAFAFA' },
  genderBtnActive: { backgroundColor: '#FFF0F3', borderColor: '#FF9A9E' },
  genderText: { fontSize: 16, color: '#999', fontWeight: 'bold' },
  genderTextActive: { color: '#FF6B81' },

  submitBtn: { padding: 18, borderRadius: 15, alignItems: 'center', shadowColor: '#FF6B81', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }
});