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
  Modal, 
  TextInput,
  Platform,
  Dimensions,
  ScrollView,
  Switch,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function PetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- STATE CHẾ ĐỘ SỬA (EDIT MODE) ---
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBreed, setEditBreed] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState(false); // false: Đã gặp, true: Đang nuôi
  const [editImageUri, setEditImageUri] = useState<string | null>(null);

  // --- STATE GALLERY & MODAL ---
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [caption, setCaption] = useState('');
  const [galleryDate, setGalleryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      const data = response.data.data;
      setPet(data);
      
      // Nạp dữ liệu vào form sửa
      setEditName(data.name);
      setEditBreed(data.breed || '');
      setEditWeight(data.weight ? data.weight.toString() : '');
      setEditNote(data.note || '');
      setEditCategory(data.category === 'owned'); // Nếu là owned thì bật switch

      setLoading(false);
    } catch (error) {
      console.log("Lỗi lấy chi tiết:", error);
      setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ CHỈNH SỬA & UPDATE ---
  const handlePickEditImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
    });
    if (!result.canceled) {
        setEditImageUri(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
        const token = await AsyncStorage.getItem('token');
        const formData = new FormData();

        formData.append('name', editName);
        formData.append('breed', editBreed);
        formData.append('weight', editWeight);
        formData.append('note', editNote);
        // 👇 Cập nhật trạng thái dựa vào nút gạt
        formData.append('category', editCategory ? 'owned' : 'encountered');

        if (editImageUri) {
            // @ts-ignore
            formData.append('image', {
                uri: editImageUri,
                type: 'image/jpeg',
                name: 'update-pet.jpg',
            });
        }

        await axios.put(API_URL, formData, {
            headers: { 
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}` 
            }
        });

        Alert.alert("Thành công", "Thông tin đã được cập nhật!");
        setIsEditing(false); // Thoát chế độ sửa
        fetchPetDetail(); // Load lại dữ liệu mới

    } catch (error) {
        Alert.alert("Lỗi", "Không lưu được thay đổi.");
        console.log(error);
    } finally {
        setSaving(false);
    }
  };

  // --- HÀM GALLERY & MEDICAL ---
  const pickImageForGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
    });
    if (!result.canceled) {
        setSelectedImageUri(result.assets[0].uri);
        setCaption(''); setGalleryDate(new Date()); setModalVisible(true);
    }
  };

  const handleUploadGallery = async () => {
    if (!selectedImageUri) return;
    setUploading(true);
    try {
        const token = await AsyncStorage.getItem('token');
        const formData = new FormData();
        // @ts-ignore
        formData.append('image', { uri: selectedImageUri, type: 'image/jpeg', name: 'gallery.jpg' });
        formData.append('caption', caption);
        formData.append('date', galleryDate.toISOString()); 

        await axios.post(`${API_URL}/gallery`, formData, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        Alert.alert("Thành công", "Đã thêm vào album!");
        setModalVisible(false); fetchPetDetail();
    } catch (error) {
        Alert.alert("Lỗi", "Không tải ảnh lên được.");
    } finally {
        setUploading(false);
    }
  };

  const renderMedicalRecord = ({ item }: any) => (
    <View style={styles.timelineItem}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
        <View style={styles.recordCard}>
            <Text style={styles.recordDate}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
            <Text style={styles.recordTitle}>{item.title} ({item.type === 'vaccine' ? '💉' : '🏥'})</Text>
            {item.description ? <Text style={styles.recordDesc}>{item.description}</Text> : null}
            {item.img_url ? <Image source={{ uri: item.img_url }} style={styles.recordImg} /> : null}
        </View>
    </View>
  );

  const renderGalleryItem = ({ item, index }: any) => {
      if (index === 0) return (
        <TouchableOpacity style={styles.addMomentBtn} onPress={pickImageForGallery}>
            <Text style={{fontSize: 30, color: '#FF6B81'}}>+</Text>
        </TouchableOpacity>
      );
      return (
          <TouchableOpacity style={styles.galleryCard} onPress={() => { setViewImage(item); setViewModalVisible(true); }}>
              <Image source={{ uri: item.img_url }} style={styles.galleryImg} />
          </TouchableOpacity>
      );
  };

  if (loading) return <ActivityIndicator size="large" color="#FF8E9E" style={{ marginTop: 50 }} />;
  if (!pet) return <View><Text>Không tìm thấy dữ liệu</Text></View>;

  // === RENDER CHÍNH ===
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      
      {/* 1. HEADER CHUNG (Ảnh & Nút Edit) */}
      <View style={styles.headerImageContainer}>
          <Image source={{ uri: isEditing && editImageUri ? editImageUri : (pet.img_url || 'https://cdn-icons-png.flaticon.com/512/616/616408.png') }} style={styles.headerImage} />
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.headerOverlay} />
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
             <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Nút bấm chuyển chế độ Sửa/Xem */}
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
             <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color="#fff" />
          </TouchableOpacity>

          {isEditing && (
             <TouchableOpacity style={styles.cameraButton} onPress={handlePickEditImage}>
                 <Ionicons name="camera" size={20} color="#fff" />
             </TouchableOpacity>
          )}
      </View>

      {/* 2. NỘI DUNG THAY ĐỔI THEO CHẾ ĐỘ */}
      <View style={styles.bodyContainer}>
        {isEditing ? (
            // --- GIAO DIỆN CHỈNH SỬA (FORM EDIT) ---
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Chỉnh sửa thông tin ✏️</Text>
                
                <Text style={styles.label}>Tên bé</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

                <Text style={styles.label}>Giống loài</Text>
                <TextInput style={styles.input} value={editBreed} onChangeText={setEditBreed} />

                <Text style={styles.label}>Cân nặng (kg)</Text>
                <TextInput style={styles.input} value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" />

                <Text style={styles.label}>Ghi chú / Hoàn cảnh gặp</Text>
                <TextInput style={[styles.input, styles.textArea]} value={editNote} onChangeText={setEditNote} multiline />

                {/* 👇 NÚT GẠT CHUYỂN ĐỔI TRẠNG THÁI */}
                <View style={styles.switchBox}>
                    <View style={{flex: 1}}>
                        <Text style={styles.switchLabel}>Đang nuôi bé này?</Text>
                        <Text style={styles.switchDesc}>Bật lên để chuyển sang danh sách "Đang nuôi".</Text>
                    </View>
                    <Switch 
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={editCategory ? "#fff" : "#f4f3f4"}
                        onValueChange={setEditCategory}
                        value={editCategory}
                    />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>LƯU THAY ĐỔI</Text>}
                </TouchableOpacity>
                <View style={{height: 50}}/>
            </ScrollView>
        ) : (
            // --- GIAO DIỆN XEM CHI TIẾT (VIEW MODE) ---
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Tên & Badge */}
                <View style={styles.titleRow}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <View style={[styles.badge, {backgroundColor: pet.category === 'owned' ? '#E8F5E9' : '#FFF3E0'}]}>
                        <Text style={{color: pet.category === 'owned' ? '#4CAF50' : '#FF9800', fontWeight: 'bold', fontSize: 12}}>
                            {pet.category === 'owned' ? '🏠 Đang nuôi' : '📸 Đã gặp'}
                        </Text>
                    </View>
                </View>

                {/* Thông tin cơ bản */}
                <View style={styles.infoRow}>
                    <Text style={styles.infoText}>🐾 {pet.species} - {pet.breed || 'Không rõ'}</Text>
                    {pet.category === 'owned' && <Text style={styles.infoText}>⚖️ {pet.weight || 0} kg</Text>}
                </View>

                {/* Ghi chú */}
                <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>📝 Ghi chú:</Text>
                    <Text style={styles.noteContent}>{pet.note || 'Chưa có ghi chú nào.'}</Text>
                </View>

                {/* 👇 LOGIC HIỂN THỊ KHÁC NHAU THEO LOẠI */}
                {pet.category === 'owned' ? (
                    // GIAO DIỆN "ĐANG NUÔI" -> HIỆN FULL TÍNH NĂNG
                    <>
                        <View style={styles.actionGrid}>
                            <TouchableOpacity style={styles.actionItem} onPress={() => router.push({ pathname: '/qrcode', params: { id: pet._id, name: pet.name } } as any)}>
                                <Image source={require('../assets/images/qr.jpg')} style={styles.actionIcon} />
                                <Text style={styles.actionLabel}>QR Code</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionItem}>
                                <Ionicons name="nutrition" size={28} color="#FF9A9E" />
                                <Text style={styles.actionLabel}>Dinh dưỡng</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>Hành trình lớn khôn 🌱</Text>
                        <FlatList 
                            horizontal data={[{ id: 'add-btn' }, ...(pet.gallery || []).slice().reverse()]}
                            renderItem={renderGalleryItem} showsHorizontalScrollIndicator={false}
                            style={{marginBottom: 20}}
                        />

                        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                            <Text style={styles.sectionTitle}>Hồ sơ sức khỏe 🩺</Text>
                            <TouchableOpacity onPress={() => router.push({ pathname: '/add-medical', params: { petId: pet._id } } as any)}>
                                <Text style={{color:'#FF6B81', fontWeight:'bold'}}>+ Thêm</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList data={pet.medical_records?.reverse() || []} renderItem={renderMedicalRecord} scrollEnabled={false} />
                    </>
                ) : (
                    // GIAO DIỆN "ĐÃ GẶP" -> HIỆN ĐƠN GIẢN & NÚT NHẬN NUÔI
                    <View style={styles.encounteredContainer}>
                        <Text style={styles.encounteredText}>
                            Bạn đã gặp bé này trên đường. Nếu bạn quyết định nhận nuôi bé, hãy bấm vào nút chỉnh sửa (✏️) ở góc trên và bật chế độ "Đang nuôi".
                        </Text>
                        <TouchableOpacity style={styles.adoptBtn} onPress={() => setIsEditing(true)}>
                            <Text style={styles.adoptText}>🏠 TÔI ĐÃ NHẬN NUÔI BÉ!</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                <View style={{height: 50}}/>
            </ScrollView>
        )}
      </View>

      {/* --- MODAL ADD GALLERY (GIỮ NGUYÊN) --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Thêm ảnh khoảnh khắc</Text>
                <Image source={{ uri: selectedImageUri }} style={styles.modalPreviewImg} />
                <TextInput style={styles.modalInput} placeholder="Mô tả..." value={caption} onChangeText={setCaption} />
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.btn, {backgroundColor:'#eee'}]}><Text>Hủy</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleUploadGallery} style={[styles.btn, {backgroundColor:'#FF6B81'}]}><Text style={{color:'#fff'}}>Lưu</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* --- MODAL VIEW IMAGE --- */}
      <Modal animationType="fade" transparent={true} visible={viewModalVisible} onRequestClose={() => setViewModalVisible(false)}>
        <View style={styles.viewerContainer}>
            <TouchableOpacity style={styles.closeViewerBtn} onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
            {viewImage && <Image source={{ uri: viewImage.img_url }} style={styles.viewerImg} resizeMode="contain" />}
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Header Ảnh
  headerImageContainer: { height: 300, width: '100%', position: 'relative' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerOverlay: { ...StyleSheet.absoluteFillObject },
  backButton: { position: 'absolute', top: 50, left: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
  editButton: { position: 'absolute', top: 50, right: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
  cameraButton: { position: 'absolute', bottom: 20, right: 20, padding: 12, backgroundColor: '#FF6B81', borderRadius: 25, elevation: 5 },

  // Body
  bodyContainer: { flex: 1, backgroundColor: '#fff', marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  
  // View Mode Styles
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  petName: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoText: { fontSize: 15, color: '#666' },
  noteBox: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 12, marginBottom: 20 },
  noteTitle: { fontWeight: 'bold', color: '#555', marginBottom: 5 },
  noteContent: { color: '#666', fontStyle: 'italic', lineHeight: 20 },

  // Owned Specific
  actionGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  actionItem: { alignItems: 'center' },
  actionIcon: { width: 35, height: 35, resizeMode: 'contain' },
  actionLabel: { marginTop: 5, fontSize: 12, color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10 },

  // Encountered Specific
  encounteredContainer: { alignItems: 'center', marginTop: 20, padding: 20, backgroundColor: '#FFF3E0', borderRadius: 15 },
  encounteredText: { textAlign: 'center', color: '#E65100', marginBottom: 15, lineHeight: 22 },
  adoptBtn: { backgroundColor: '#FF9800', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, elevation: 3 },
  adoptText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // List Items
  addMomentBtn: { width: 100, height: 130, borderRadius: 10, borderWidth: 1, borderColor: '#FF9A9E', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  galleryCard: { width: 100, height: 130, borderRadius: 10, marginRight: 10, overflow: 'hidden' },
  galleryImg: { width: '100%', height: '100%' },
  timelineItem: { flexDirection: 'row', marginBottom: 15 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF9A9E', marginTop: 5, zIndex: 1 },
  timelineLine: { position: 'absolute', left: 5, top: 15, bottom: -15, width: 2, backgroundColor: '#eee' },
  recordCard: { flex: 1, marginLeft: 15, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 10 },
  recordDate: { fontSize: 12, color: '#999', fontWeight: 'bold' },
  recordTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  recordDesc: { fontSize: 13, color: '#555', marginTop: 2 },
  recordImg: { width: '100%', height: 120, borderRadius: 8, marginTop: 8 },

  // Edit Mode Styles
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 15, marginBottom: 5 },
  input: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 10, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#FF6B81', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  switchBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, backgroundColor: '#E8F5E9', padding: 15, borderRadius: 15 },
  switchLabel: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  switchDesc: { fontSize: 12, color: '#4CAF50', marginTop: 2 },

  // Modal Common
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalPreviewImg: { width: '100%', height: 150, borderRadius: 10, marginBottom: 15 },
  modalInput: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 10, marginBottom: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  btn: { padding: 10, borderRadius: 10, marginLeft: 10, minWidth: 60, alignItems: 'center' },

  // Viewer
  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeViewerBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  viewerImg: { width: width, height: height * 0.8 },
});