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
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// ✅ ĐÃ SỬA: Thêm đầy đủ thuộc tính để chiều lòng TypeScript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // Hiển thị thông báo dạng banner khi app đang mở
    shouldShowList: true,   // Hiển thị trong trung tâm thông báo
  }),
});

export default function AddMedicalScreen() {
  const { petId } = useLocalSearchParams();
  const router = useRouter();

  // Dùng Date object chuẩn thay vì string để tránh lỗi format
  const [date, setDate] = useState(new Date());
  const [nextDate, setNextDate] = useState<Date | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [doctor, setDoctor] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quản lý ẩn/hiện lịch
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${petId}/medical`;

  // Xin quyền thông báo lúc mới vào màn hình
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Không được cấp quyền thông báo!');
      }
    })();
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onNextDateChange = (event: any, selectedDate?: Date) => {
    setShowNextDatePicker(false);
    if (selectedDate) setNextDate(selectedDate);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5, // Giảm chất lượng ảnh để upload nhanh hơn
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // 👇 HÀM ĐẶT LỊCH (Đã sửa lỗi TypeScript Trigger)
  const scheduleNextAppointment = async (appointmentDate: Date) => {
    try {
        // Tạo thời gian nhắc: 8h sáng ngày tái khám
        const triggerDate = new Date(appointmentDate);
        triggerDate.setHours(8, 0, 0, 0);

        const now = new Date();
        const diffInSeconds = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);

        if (diffInSeconds <= 0) return; 

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "🔔 NHẮC LỊCH TÁI KHÁM",
                body: `Hôm nay là ngày tái khám: ${title}. Bố/Mẹ nhớ đưa bé đi nhé!`,
                sound: true,
            },
            trigger: {
                // ✅ ĐÃ SỬA: Khai báo rõ loại trigger là TIME_INTERVAL
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: diffInSeconds,
                repeats: false,
            },
        });
        
        const daysLeft = Math.ceil(diffInSeconds / (3600 * 24));
        Alert.alert("Đã đặt báo thức! ⏰", `App sẽ nhắc bạn vào 8h sáng ngày ${triggerDate.toLocaleDateString('vi-VN')} (${daysLeft} ngày nữa).`);
    } catch (error) {
        console.log("Lỗi đặt lịch:", error);
    }
  };

  const handleAddRecord = async () => {
    if (!title || !description) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung!');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      
      // Gửi định dạng ISO chuẩn cho Server
      formData.append('date', date.toISOString());
      formData.append('title', title);
      formData.append('description', description);
      formData.append('doctor', doctor);
      formData.append('type', 'medical');

      if (nextDate) {
          formData.append('next_appointment', nextDate.toISOString());
      }

      if (image) {
        // @ts-ignore
        formData.append('image', { uri: image, type: 'image/jpeg', name: 'medical-record.jpg' });
      }
      
      await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      // Logic sau khi lưu thành công
      if (nextDate) {
        Alert.alert(
          "Đã lưu hồ sơ! ✅",
          "Bạn có muốn App nhắc nhở vào sáng ngày TÁI KHÁM không?",
          [
            { text: "Không cần", style: "cancel", onPress: () => router.back() },
            { text: "Có, nhắc tôi!", onPress: async () => {
                await scheduleNextAppointment(nextDate);
                router.back();
              } 
            }
          ]
        );
      } else {
        Alert.alert('Thành công! 🏥', 'Đã lưu hồ sơ sức khỏe.');
        router.back();
      }

    } catch (error) {
      console.log('Lỗi:', error);
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ lúc này. Kiểm tra mạng hoặc thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.headerBackground} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FF6B81" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm Hồ Sơ Y Tế 💊</Text>
      </View>

      <Animatable.View animation="fadeInUp" duration={800} style={styles.formContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.instruction}>Lưu giữ đơn thuốc, lịch tiêm hoặc hình ảnh X-quang.</Text>

          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="camera" size={50} color="#FF9A9E" />
                <Text style={{ color: '#FF8E9E', marginTop: 5 }}>Chụp/Chọn ảnh đơn thuốc</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Tiêu đề (*)</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ví dụ: Tiêm phòng dại..." />

          <View style={styles.row}>
            {/* NGÀY KHÁM */}
            <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.label}>Ngày khám</Text>
                <TouchableOpacity style={styles.dateInputContainer} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateInputText}>{date.toLocaleDateString('vi-VN')}</Text>
                    <Ionicons name="calendar-outline" size={24} color="#FF6B81" />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
                )}
            </View>

            {/* NGÀY TÁI KHÁM */}
            <View style={{flex: 1}}>
                <Text style={[styles.label, {color: '#FF6B81'}]}>Ngày tái khám (?)</Text>
                <TouchableOpacity style={[styles.dateInputContainer, {borderColor: '#FF6B81'}]} onPress={() => setShowNextDatePicker(true)}>
                    <Text style={styles.dateInputText}>
                        {nextDate ? nextDate.toLocaleDateString('vi-VN') : 'Chọn ngày...'}
                    </Text>
                    <Ionicons name="alarm-outline" size={24} color="#FF6B81" />
                </TouchableOpacity>
                {showNextDatePicker && (
                    <DateTimePicker value={nextDate || new Date()} mode="date" display="default" onChange={onNextDateChange} minimumDate={new Date()} />
                )}
            </View>
          </View>

          <Text style={styles.label}>Bác sĩ / Nơi khám</Text>
          <TextInput style={styles.input} value={doctor} onChangeText={setDoctor} placeholder="BS. Nam / PetMart" />

          <Text style={styles.label}>Chi tiết / Chẩn đoán (*)</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription}
            placeholder="Ghi chú bệnh tình, liều thuốc..."
            multiline={true}
            textAlignVertical="top"
          />

          <TouchableOpacity onPress={handleAddRecord} disabled={loading} style={{ marginTop: 20, marginBottom: 50 }}>
            <LinearGradient colors={['#FF9A9E', '#FF6B81']} style={styles.submitBtn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>LƯU HỒ SƠ ✅</Text>}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FECFEF' },
  headerBackground: { height: 120, width: '100%', position: 'absolute', top: 0 },
  header: { marginTop: 40, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 15, marginRight: 15, elevation: 5 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  formContainer: { flex: 1, backgroundColor: '#fff', marginTop: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 10 },
  instruction: { textAlign: 'center', color: '#888', marginBottom: 20, fontStyle: 'italic' },
  imagePicker: { height: 150, width: '100%', backgroundColor: '#FFF0F3', borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#FF9A9E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  placeholder: { alignItems: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 12, fontSize: 16 },
  
  // Nút chọn ngày thay vì TextInput để tránh nhập sai
  dateInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  dateInputText: { color: '#333', fontSize: 16 },
  
  textArea: { height: 100 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  submitBtn: { padding: 15, borderRadius: 15, alignItems: 'center', shadowColor: '#FF6B81', shadowOpacity: 0.3, elevation: 5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});