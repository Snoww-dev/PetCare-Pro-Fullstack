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

export default function AddMedicalScreen() {
  const { petId } = useLocalSearchParams();
  const router = useRouter();

  const todayRaw = new Date();
  const todayStr = todayRaw.toISOString().split('T')[0]; // YYYY-MM-DD

  const [date, setDate] = useState(todayStr);
  const [nextDate, setNextDate] = useState(''); 

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [doctor, setDoctor] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quản lý ẩn/hiện lịch
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${petId}/medical`;

  // Hàm chuẩn hóa ngày tháng (Chấp nhận cả / và -)
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate.toISOString().split('T')[0]);
  };

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

  // 👇 HÀM ĐẶT LỊCH (Đã sửa nội dung thông báo)
  const scheduleNextAppointment = async (validNextDateString: string) => {
    const parts = validNextDateString.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; 
    const day = parseInt(parts[2]);

    const triggerDate = new Date(year, month, day, 8, 0, 0); // 8h sáng
    const now = new Date();
    const diffInSeconds = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);

    if (isNaN(diffInSeconds) || diffInSeconds <= 0) {
        Alert.alert("Lỗi", "Ngày tái khám phải là ngày trong tương lai!");
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
        // 👇 Ghi rõ ngày tháng vào nội dung để bạn không nhầm
        body: `Ngày ${day}/${month + 1}) là lịch TÁI KHÁM cho bé (Vấn đề: ${title}). Bố/Mẹ nhớ đưa bé đi nhé!`,
        sound: true,
      },
      trigger: {
          seconds: diffInSeconds,
          repeats: false,
          channelId: 'default',
      },
    });
    
    const daysLeft = Math.ceil(diffInSeconds / (3600 * 24));
    Alert.alert("Đã đặt lịch! 🔔", `App sẽ nhắc bạn vào 8h sáng ngày ${day}/${month + 1}/${year} (${daysLeft} ngày nữa).`);
  };

  const handleAddRecord = async () => {
    if (!title || !description) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung!');
      return;
    }

    const finalDate = parseDateInput(date);
    const finalNextDate = parseDateInput(nextDate);

    if (!finalDate) {
        Alert.alert("Lỗi ngày khám", "Ngày khám không hợp lệ (VD: 02-05-2026)");
        return;
    }
    if (nextDate && !finalNextDate) {
        Alert.alert("Lỗi ngày tái khám", "Ngày tái khám không hợp lệ (VD: 10-05-2026)");
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
      formData.append('type', 'medical');

      // 👇 Gửi ngày tái khám lên Server
      if (finalNextDate) {
          formData.append('next_appointment', finalNextDate);
      }

      if (image) {
        // @ts-ignore
        formData.append('image', { uri: image, type: 'image/jpeg', name: 'medical-record.jpg' });
      }
      
      await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      if (finalNextDate) {
        Alert.alert(
          "Đã lưu hồ sơ! ✅",
          "Bạn có muốn App nhắc nhở vào sáng ngày TÁI KHÁM không?",
          [
            { text: "Không cần", style: "cancel", onPress: () => router.back() },
            { text: "Có, nhắc tôi!", onPress: async () => {
                await scheduleNextAppointment(finalNextDate);
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
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ lúc này.');
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
          <TextInput style={styles.input} value={doctor} onChangeText={setDoctor} placeholder="BS. Nam / PetMart" />

          <Text style={styles.label}>Chi tiết / Chẩn đoán (*)</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription}
            placeholder="Ghi chú bệnh tình..."
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
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 10 },
  dateInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  dateInputText: { flex: 1, paddingVertical: 5, color: '#333' },
  textArea: { height: 100 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  submitBtn: { padding: 15, borderRadius: 15, alignItems: 'center', shadowColor: '#FF6B81', shadowOpacity: 0.3, elevation: 5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});