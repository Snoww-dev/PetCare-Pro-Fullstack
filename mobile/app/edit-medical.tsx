import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications'; // Dùng lại thư viện thông báo

export default function EditMedicalScreen() {
  const { petId, recordId, oldData } = useLocalSearchParams();
  const router = useRouter();
  
  // Parse dữ liệu cũ
  const parsedData = oldData ? JSON.parse(oldData as string) : {};

  const [date, setDate] = useState(parsedData.date || '');
  const [title, setTitle] = useState(parsedData.title || '');
  const [description, setDescription] = useState(parsedData.description || '');
  const [doctor, setDoctor] = useState(parsedData.doctor || '');
  const [nextDate, setNextDate] = useState(parsedData.next_appointment ? parsedData.next_appointment.split('T')[0] : '');
  
  const [image, setImage] = useState<string | null>(null); // Ảnh mới
  const [currentImage, setCurrentImage] = useState(parsedData.img_url || null); // Ảnh cũ
  const [loading, setLoading] = useState(false);

  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${petId}/medical/${recordId}`;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // Hàm nhắc nhở lịch tái khám (Logic thông minh hơn)
  const scheduleNextAppointment = async () => {
      if(!nextDate) return;
      
      const triggerDate = new Date(nextDate);
      triggerDate.setHours(8, 0, 0, 0); // Nhắc lúc 8h sáng ngày tái khám

      if (triggerDate <= new Date()) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Nhắc lịch tái khám",
          body: `Hôm nay là ngày tái khám cho: ${title}. Đừng quên nhé!`,
          sound: true,
        },
        trigger: triggerDate as any,
      });
      
      Alert.alert("Đã đặt lịch! 🔔", "App sẽ nhắc bạn đi tái khám vào 8h sáng ngày đó.");
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('date', date);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('doctor', doctor);
      
      // Gửi thêm ngày tái khám
      if(nextDate) formData.append('next_appointment', nextDate);

      if (image) {
        // @ts-ignore
        formData.append('image', { uri: image, type: 'image/jpeg', name: 'updated.jpg' });
      }

      await axios.put(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      // Nếu có nhập ngày tái khám, hỏi user có muốn đặt chuông không
      if(nextDate) {
          Alert.alert("Lịch tái khám", "Bạn có muốn App nhắc nhở vào ngày tái khám không?", [
              { text: "Không", onPress: () => router.back() },
              { text: "Có, nhắc tôi", onPress: async () => {
                  await scheduleNextAppointment();
                  router.back();
              }}
          ]);
      } else {
          Alert.alert('Thành công', 'Đã cập nhật hồ sơ!');
          router.back();
      }

    } catch (error) {
      Alert.alert('Lỗi', 'Không cập nhật được.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.headerBackground} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#FF6B81" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa Hồ Sơ</Text>
      </View>

      <Animatable.View animation="fadeInUp" style={styles.formContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Ảnh */}
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                <Image source={{ uri: image || currentImage || 'https://via.placeholder.com/150' }} style={{width: '100%', height: '100%', resizeMode: 'contain'}} />
                <View style={{position: 'absolute', bottom: 5, right: 5, backgroundColor: '#fff', padding: 5, borderRadius: 10}}><Text>📷</Text></View>
            </TouchableOpacity>

            <Text style={styles.label}>Tiêu đề (*)</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />

            <View style={{flexDirection: 'row', gap: 10}}>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>Ngày khám</Text>
                    <TextInput style={styles.input} value={date} onChangeText={setDate} />
                </View>
                <View style={{flex: 1}}>
                     {/* 👇 LOGIC MỚI: NGÀY TÁI KHÁM */}
                    <Text style={[styles.label, {color: '#FF6B81'}]}>Ngày tái khám (?)</Text>
                    <TextInput 
                        style={[styles.input, {borderColor: '#FF6B81', borderWidth: 1}]} 
                        value={nextDate} 
                        onChangeText={setNextDate} 
                        placeholder="YYYY-MM-DD"
                    />
                </View>
            </View>

            <Text style={styles.label}>Chi tiết</Text>
            <TextInput style={[styles.input, {height: 80}]} multiline value={description} onChangeText={setDescription} />

            <TouchableOpacity onPress={handleUpdate} disabled={loading} style={{ marginTop: 20, marginBottom: 50 }}>
                <LinearGradient colors={['#FF9A9E', '#FF6B81']} style={styles.submitBtn}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color: '#fff', fontWeight: 'bold'}}>CẬP NHẬT XONG ✅</Text>}
                </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FECFEF' },
  headerBackground: { height: 120, width: '100%', position: 'absolute' },
  header: { marginTop: 40, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 15, marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  formContainer: { flex: 1, backgroundColor: '#fff', marginTop: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  imagePicker: { height: 120, width: '100%', backgroundColor: '#FFF0F3', marginBottom: 20, borderRadius: 10, overflow: 'hidden' },
  label: { fontWeight: 'bold', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 10 },
  submitBtn: { padding: 15, borderRadius: 15, alignItems: 'center' }
});