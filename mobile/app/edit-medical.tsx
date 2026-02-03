import React, { useState } from 'react';
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
import * as Notifications from 'expo-notifications'; 
import DateTimePicker from '@react-native-community/datetimepicker'; // 👈 Import DatePicker

export default function EditMedicalScreen() {
  const { petId, recordId, oldData } = useLocalSearchParams();
  const router = useRouter();
  
  // Parse dữ liệu cũ được truyền sang
  const parsedData = oldData ? JSON.parse(oldData as string) : {};

  // Hàm xử lý ngày cũ (để tránh lỗi hiển thị)
  const initDate = (val: string) => {
      if (!val) return '';
      // Nếu dữ liệu cũ có dạng ISO (2026-05-02T00:00...) thì cắt lấy phần ngày
      return val.includes('T') ? val.split('T')[0] : val; 
  };

  const [date, setDate] = useState(initDate(parsedData.date));
  const [title, setTitle] = useState(parsedData.title || '');
  const [description, setDescription] = useState(parsedData.description || '');
  const [doctor, setDoctor] = useState(parsedData.doctor || '');
  const [nextDate, setNextDate] = useState(initDate(parsedData.next_appointment)); // 👇 Lấy ngày tái khám cũ
  
  const [image, setImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(parsedData.img_url || null);
  const [loading, setLoading] = useState(false);

  // Quản lý hiển thị lịch
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${petId}/medical/${recordId}`;

  // 👇 HÀM CHUYỂN ĐỔI NGÀY THÔNG MINH (Giống bên AddMedical)
  const parseDateInput = (inputDate: string) => {
      if (!inputDate) return null;
      let normalized = inputDate.replace(/[\/\.]/g, '-');
      const parts = normalized.split('-');

      if (parts[0].length === 4 && parts.length === 3) return normalized; // YYYY-MM-DD

      if (parts.length === 3 && parts[2].length === 4) { // DD-MM-YYYY
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
      }
      return null;
  };

  // Chọn ngày khám từ lịch
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate.toISOString().split('T')[0]);
  };

  // Chọn ngày tái khám từ lịch
  const onNextDateChange = (event: any, selectedDate?: Date) => {
    setShowNextDatePicker(false);
    if (selectedDate) setNextDate(selectedDate.toISOString().split('T')[0]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // Logic đặt lịch (Dùng số giây)
  const scheduleNextAppointment = async (validNextDateString: string) => {
      const parts = validNextDateString.split('-'); 
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; 
      const day = parseInt(parts[2]);

      const triggerDate = new Date(year, month, day, 8, 0, 0); // 8h sáng
      const now = new Date();
      const diffInSeconds = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);

      if (isNaN(diffInSeconds) || diffInSeconds <= 0) {
          Alert.alert("Lỗi", "Ngày tái khám phải là tương lai!");
          return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 NHẮC LỊCH TÁI KHÁM", 
          body: `Hôm nay đến hẹn TÁI KHÁM cho bé (Vấn đề: ${title}). Bố/Mẹ nhớ đưa bé đi nhé!`,
          sound: true,
        },
        trigger: {
            seconds: diffInSeconds,
            repeats: false,
            channelId: 'default',
        },
      });
      
      const daysLeft = Math.ceil(diffInSeconds / (3600 * 24));
      Alert.alert("Đã đặt lịch! 🔔", `App sẽ nhắc bạn sau khoảng ${daysLeft} ngày nữa (vào sáng ngày ${day}/${month + 1}/${year}).`);
  };

  const handleUpdate = async () => {
    // Chuẩn hóa ngày trước khi gửi
    const finalDate = parseDateInput(date);
    const finalNextDate = parseDateInput(nextDate);

    if (!finalDate) {
        Alert.alert("Lỗi ngày khám", "Định dạng ngày không hợp lệ (VD: 02-05-2026)");
        return;
    }
    if (nextDate && !finalNextDate) {
        Alert.alert("Lỗi ngày tái khám", "Định dạng ngày không hợp lệ (VD: 10-05-2026)");
        return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('date', finalDate);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('doctor', doctor);
      
      if(finalNextDate) {
          formData.append('next_appointment', finalNextDate);
      } else {
          // Nếu xóa trắng ô ngày tái khám -> Gửi chuỗi rỗng để xóa trên server
          formData.append('next_appointment', ''); 
      }

      if (image) {
        // @ts-ignore
        formData.append('image', { uri: image, type: 'image/jpeg', name: 'updated.jpg' });
      }

      await axios.put(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      if(finalNextDate) {
          Alert.alert("Lịch tái khám", "Bạn có muốn cập nhật lời nhắc cho ngày mới này không?", [
              { text: "Không", onPress: () => router.back() },
              { text: "Có, nhắc tôi", onPress: async () => {
                  await scheduleNextAppointment(finalNextDate);
                  router.back();
              }}
          ]);
      } else {
          Alert.alert('Thành công', 'Đã cập nhật hồ sơ!');
          router.back();
      }

    } catch (error) {
      console.log(error);
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
        <Text style={styles.headerTitle}>Sửa Lịch Khám</Text>
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
                {/* NGÀY KHÁM */}
                <View style={{flex: 1}}>
                    <Text style={styles.label}>Ngày khám</Text>
                    <View style={styles.dateInputContainer}>
                        <TextInput style={styles.dateInputText} value={date} onChangeText={setDate} placeholder="DD-MM-YYYY" />
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={24} color="#FF6B81" />
                        </TouchableOpacity>
                    </View>
                    {showDatePicker && (
                        <DateTimePicker value={new Date()} mode="date" display="default" onChange={onDateChange} />
                    )}
                </View>

                {/* NGÀY TÁI KHÁM */}
                <View style={{flex: 1}}>
                    <Text style={[styles.label, {color: '#FF6B81'}]}>Ngày tái khám (?)</Text>
                    <View style={[styles.dateInputContainer, {borderColor: '#FF6B81'}]}>
                        <TextInput style={styles.dateInputText} value={nextDate} onChangeText={setNextDate} placeholder="DD-MM-YYYY" />
                        <TouchableOpacity onPress={() => setShowNextDatePicker(true)}>
                            <Ionicons name="alarm-outline" size={24} color="#FF6B81" />
                        </TouchableOpacity>
                    </View>
                    {showNextDatePicker && (
                        <DateTimePicker value={new Date()} mode="date" display="default" onChange={onNextDateChange} minimumDate={new Date()} />
                    )}
                </View>
            </View>

            <Text style={styles.label}>Bác sĩ / Nơi khám</Text>
            <TextInput style={styles.input} value={doctor} onChangeText={setDoctor} />

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
  
  // Style ô ngày tháng
  dateInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  dateInputText: { flex: 1, paddingVertical: 5, color: '#333' },

  submitBtn: { padding: 15, borderRadius: 15, alignItems: 'center' }
});