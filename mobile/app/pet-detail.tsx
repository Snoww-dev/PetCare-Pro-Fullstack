import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert,
  Modal, // Dùng để hiện cửa sổ nhập liệu và xem ảnh
  TextInput,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker'; // 👈 Import DatePicker
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function PetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // --- STATE CHO MODAL NHẬP LIỆU (ADD) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [caption, setCaption] = useState('');
  const [galleryDate, setGalleryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- STATE CHO MODAL XEM ẢNH (VIEW) ---
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewImage, setViewImage] = useState<any>(null);

  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${params.id}`;

  useFocusEffect(
    useCallback(() => {
      fetchPetDetail();
    }, [])
  );

  const fetchPetDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPet(response.data.data);
      setLoading(false);
    } catch (error) {
      console.log("Lỗi lấy chi tiết:", error);
      setLoading(false);
    }
  };

  // 1. Bước 1: Chọn ảnh từ thư viện -> Mở Modal nhập liệu
  const pickImageForGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
    });

    if (!result.canceled) {
        setSelectedImageUri(result.assets[0].uri);
        setCaption(''); // Reset caption
        setGalleryDate(new Date()); // Reset date
        setModalVisible(true); // Mở Modal
    }
  };

  // 2. Bước 2: Upload ảnh kèm Caption và Date lên Server
  const handleUploadGallery = async () => {
    if (!selectedImageUri) return;

    setUploading(true);
    try {
        const token = await AsyncStorage.getItem('token');
        const formData = new FormData();
        
        // @ts-ignore
        formData.append('image', {
            uri: selectedImageUri,
            type: 'image/jpeg',
            name: 'gallery.jpg',
        });
        formData.append('caption', caption);
        // Chuyển ngày sang ISO string để gửi lên Server
        formData.append('date', galleryDate.toISOString()); 

        await axios.post(`${API_URL}/gallery`, formData, {
            headers: { 
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}` 
            }
        });

        Alert.alert("Thành công", "Đã thêm vào hành trình lớn khôn! 🌱");
        setModalVisible(false); // Đóng modal
        fetchPetDetail(); // Load lại dữ liệu

    } catch (error) {
        Alert.alert("Lỗi", "Không tải ảnh lên được lúc này.");
        console.log(error);
    } finally {
        setUploading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
        setGalleryDate(selectedDate);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    Alert.alert("Xóa hồ sơ", "Bạn chắc chắn muốn xóa dòng lịch sử này chứ?", [
        { text: "Hủy", style: "cancel" },
        {
            text: "Xóa", style: "destructive", onPress: async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    await axios.delete(`${API_URL}/medical/${recordId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchPetDetail(); 
                    Alert.alert("Thành công", "Đã xóa bản ghi.");
                } catch (error) {
                    Alert.alert("Lỗi", "Không xóa được lúc này.");
                }
            }
        }
    ]);
  };

  // Render 1 item trong Gallery
  const renderGalleryItem = ({ item, index }: any) => {
      if (index === 0) {
          return (
            <TouchableOpacity style={styles.addMomentBtn} onPress={pickImageForGallery}>
                <Text style={{fontSize: 30, color: '#FF6B81'}}>+</Text>
                <Text style={{fontSize: 10, color: '#FF6B81', marginTop: 5}}>Thêm ảnh</Text>
            </TouchableOpacity>
          );
      }
      
      const realItem = item; 
      return (
          <TouchableOpacity 
            style={styles.galleryCard}
            onPress={() => {
                setViewImage(realItem); // Lưu ảnh đang chọn
                setViewModalVisible(true); // Mở Modal xem ảnh
            }}
          >
              <Image source={{ uri: realItem.img_url }} style={styles.galleryImg} />
              
              {/* Hiển thị ngày và caption ngắn gọn */}
              <View style={styles.galleryOverlay}>
                  <Text style={styles.galleryDate}>
                      {new Date(realItem.date).toLocaleDateString('vi-VN')}
                  </Text>
                  {realItem.caption ? (
                      <Text numberOfLines={1} style={styles.galleryCaptionSmall}>
                          {realItem.caption}
                      </Text>
                  ) : null}
              </View>
          </TouchableOpacity>
      );
  };

  const renderMedicalRecord = ({ item }: any) => (
    <View style={styles.timelineItem}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
        <View style={styles.recordCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.recordDate}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
                    <Text style={styles.recordTitle}>{item.title} ({item.type === 'vaccine' ? '💉' : '🏥'})</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity 
                        style={{ padding: 5, marginRight: 5 }}
                        onPress={() => router.push({
                            pathname: '/edit-medical',
                            params: { petId: pet._id, recordId: item._id, oldData: JSON.stringify(item) }
                        } as any)}
                    >
                        <Text style={{fontSize: 18}}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 5 }} onPress={() => handleDeleteRecord(item._id)}>
                        <Text style={{fontSize: 18}}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {item.description ? <Text style={styles.recordDesc}>{item.description}</Text> : null}
            {item.doctor ? <Text style={styles.recordDoctor}>👨‍⚕️ {item.doctor}</Text> : null}
            {item.next_appointment ? (
                <View style={{ marginTop: 8, backgroundColor: '#FFF0F3', padding: 8, borderRadius: 8 }}>
                    <Text style={{ color: '#FF6B81', fontWeight: 'bold', fontSize: 12 }}>
                        ⏰ Lịch tái khám: {new Date(item.next_appointment).toLocaleDateString('vi-VN')}
                    </Text>
                </View>
            ) : null}
            {item.img_url ? (
              <Image source={{ uri: item.img_url }} style={{ width: '100%', height: 150, borderRadius: 10, marginTop: 10, resizeMode: 'cover' }} />
            ) : null}
        </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#FF8E9E" style={{ marginTop: 50 }} />;
  if (!pet) return <View><Text>Không tìm thấy dữ liệu</Text></View>;

  const galleryData = [{ id: 'add-btn' }, ...(pet.gallery || []).slice().reverse()];

  return (
    <View style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Image source={{ uri: pet.img_url || 'https://cdn-icons-png.flaticon.com/512/616/616408.png' }} style={styles.avatar} />
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.name}>{pet.name} </Text>
            <Image source={require('../assets/images/logo-detail.png')} style={{ width: 24, height: 24, marginLeft: 5, resizeMode: 'contain' }} />
          </View>
          <Text style={styles.subText}>{pet.species} - {pet.breed}</Text>
          <Text style={styles.subText}>{pet.weight} kg - {pet.gender === 'male' ? 'Đực' : 'Cái'}</Text>
        </View>
      </View>

      {/* --- ACTION BUTTONS --- */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/qrcode', params: { id: pet._id, name: pet.name, img: pet.img_url } } as any)}>
            <View style={styles.iconCircle}>
                <Image source={require('../assets/images/qr.jpg')} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
            </View>
            <Text style={styles.btnLabel}>Lấy mã QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, {flex: 1.5}]} onPress={() => router.push({ pathname: '/edit-pet', params: { id: pet._id } } as any)}>
            <LinearGradient colors={['#FF9A9E', '#FF6B81']} style={styles.gradientBtn}>
                <Text style={{fontSize: 20, marginRight: 5}}>✏️</Text>
                <Text style={styles.gradientText}>Chỉnh sửa</Text>
            </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* --- GROWTH GALLERY --- */}
      <View style={{ marginTop: 25, marginBottom: 10 }}>
          <View style={{paddingHorizontal: 20, marginBottom: 10}}>
             <Text style={styles.sectionTitle}>Hành trình lớn khôn 🌱</Text>
          </View>
          <FlatList 
            horizontal
            data={galleryData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderGalleryItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
      </View>

      {/* --- MEDICAL RECORDS --- */}
      <View style={styles.body}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hồ sơ sức khỏe 🩺</Text>
            <TouchableOpacity style={styles.addRecordBtn} onPress={() => router.push({ pathname: '/add-medical', params: { petId: pet._id } } as any)}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>+ Thêm</Text>
            </TouchableOpacity>
        </View>
        <FlatList 
            data={pet.medical_records?.reverse() || []}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderMedicalRecord}
            ListEmptyComponent={<Text style={{textAlign: 'center', color: '#999', marginTop: 20}}>Chưa có lịch sử khám/tiêm nào.</Text>}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        />
      </View>
      
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/home' as any)}>
        <Text style={{color: '#FF8E9E', fontWeight: 'bold'}}>⬅ Quay lại</Text>
      </TouchableOpacity>

      {/* ========================================= */}
      {/* MODAL 1: NHẬP LIỆU (ADD IMAGE & CAPTION)  */}
      {/* ========================================= */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Thêm khoảnh khắc 📸</Text>
                
                {/* Ảnh preview */}
                <Image source={{ uri: selectedImageUri }} style={styles.modalPreviewImg} />

                {/* Chọn ngày */}
                <Text style={styles.modalLabel}>Ngày chụp:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                    <Text style={{color: '#333'}}>{galleryDate.toLocaleDateString('vi-VN')}</Text>
                    <Ionicons name="calendar" size={20} color="#FF6B81" />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker value={galleryDate} mode="date" display="default" onChange={onDateChange} />
                )}

                {/* Nhập Caption */}
                <Text style={styles.modalLabel}>Mô tả:</Text>
                <TextInput 
                    style={styles.modalInput} 
                    placeholder="Ví dụ: Lần đầu đi tắm..." 
                    value={caption}
                    onChangeText={setCaption}
                />

                {/* Nút Save / Cancel */}
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.btn, styles.btnCancel]}>
                        <Text style={{color: '#666'}}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleUploadGallery} style={[styles.btn, styles.btnSave]}>
                        {uploading ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Lưu lại</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* ========================================= */}
      {/* MODAL 2: XEM ẢNH FULL SCREEN (VIEWER)     */}
      {/* ========================================= */}
      <Modal animationType="fade" transparent={true} visible={viewModalVisible} onRequestClose={() => setViewModalVisible(false)}>
        <View style={styles.viewerContainer}>
            <TouchableOpacity style={styles.closeViewerBtn} onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>

            {viewImage && (
                <>
                    <Image source={{ uri: viewImage.img_url }} style={styles.viewerImg} resizeMode="contain" />
                    <View style={styles.viewerInfo}>
                        <Text style={styles.viewerDate}>{new Date(viewImage.date).toLocaleDateString('vi-VN')}</Text>
                        {viewImage.caption ? <Text style={styles.viewerCaption}>{viewImage.caption}</Text> : null}
                    </View>
                </>
            )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F3' },
  header: { flexDirection: 'row', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', elevation: 5 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#eee', borderWidth: 3, borderColor: '#FF8E9E' },
  info: { marginLeft: 20, flex: 1 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subText: { color: '#666', marginTop: 4, fontSize: 15 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3, marginBottom: 5 },
  btnLabel: { color: '#FF6B81', fontWeight: 'bold', fontSize: 12 },
  gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, width: '100%', elevation: 4 },
  gradientText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Gallery Styles
  addMomentBtn: { width: 100, height: 140, borderRadius: 15, borderWidth: 2, borderColor: '#FF9A9E', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 15, backgroundColor: '#FFF5F7' },
  galleryCard: { width: 120, height: 140, borderRadius: 15, marginRight: 15, overflow: 'hidden', elevation: 3, backgroundColor: '#fff' },
  galleryImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  galleryOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', padding: 5 },
  galleryDate: { color: '#fff', fontSize: 10, textAlign: 'center', fontWeight: 'bold' },
  galleryCaptionSmall: { color: '#eee', fontSize: 10, textAlign: 'center', fontStyle: 'italic' },

  body: { flex: 1, padding: 20, paddingTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addRecordBtn: { backgroundColor: '#FF8E9E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, elevation: 2 },

  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF8E9E', marginTop: 5, zIndex: 1, borderWidth: 2, borderColor: '#fff' },
  timelineLine: { position: 'absolute', left: 6, top: 15, bottom: -25, width: 2, backgroundColor: '#FFD1DC' },
  recordCard: { flex: 1, marginLeft: 15, backgroundColor: '#fff', padding: 15, borderRadius: 15, elevation: 2 },
  recordDate: { fontSize: 12, color: '#999', marginBottom: 5, fontWeight: 'bold' },
  recordTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  recordDesc: { color: '#555', marginTop: 5, lineHeight: 20 },
  recordDoctor: { fontSize: 12, color: '#FF8E9E', marginTop: 8, fontStyle: 'italic' },
  backBtn: { position: 'absolute', bottom: 30, left: 30, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, elevation: 5 },

  // --- STYLES CHO MODAL NHẬP LIỆU ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  modalPreviewImg: { width: '100%', height: 150, borderRadius: 10, resizeMode: 'cover', marginBottom: 15 },
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 10, marginBottom: 5 },
  datePickerBtn: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#F5F5F5', borderRadius: 10 },
  modalInput: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 10, fontSize: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  btn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginLeft: 10 },
  btnCancel: { backgroundColor: '#eee' },
  btnSave: { backgroundColor: '#FF6B81' },

  // --- STYLES CHO MODAL XEM ẢNH (VIEWER) ---
  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeViewerBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  viewerImg: { width: width, height: height * 0.7 },
  viewerInfo: { position: 'absolute', bottom: 50, left: 0, right: 0, padding: 20, alignItems: 'center' },
  viewerDate: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  viewerCaption: { color: '#ddd', fontSize: 14, marginTop: 5, textAlign: 'center' }
});