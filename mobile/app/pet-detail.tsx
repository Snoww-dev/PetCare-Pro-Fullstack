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

  // --- STATE EDIT MODE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBreed, setEditBreed] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState(false); 
  const [editImageUri, setEditImageUri] = useState<string | null>(null);

  // --- STATE GALLERY & MODAL ---
  const [addModalVisible, setAddModalVisible] = useState(false); 
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [caption, setCaption] = useState('');
  const [galleryDate, setGalleryDate] = useState(new Date());
  
  // Gallery Edit/View Modal
  const [editGalleryVisible, setEditGalleryVisible] = useState(false);
  const [currentGalleryItem, setCurrentGalleryItem] = useState<any>(null);
  const [editGalleryCaption, setEditGalleryCaption] = useState('');
  const [editGalleryDate, setEditGalleryDate] = useState(new Date());

  // --- STATE MEDICAL DETAIL ---
  const [medicalModalVisible, setMedicalModalVisible] = useState(false);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<any>(null);

  // Date Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditGalleryDatePicker, setShowEditGalleryDatePicker] = useState(false);

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
      
      setEditName(data.name);
      setEditBreed(data.breed || '');
      setEditWeight(data.weight ? data.weight.toString() : '');
      setEditNote(data.note || '');
      setEditCategory(data.category === 'owned'); 

      setLoading(false);
    } catch (error) {
      console.log("Lỗi:", error);
      setLoading(false);
    }
  };

  const handlePickEditImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, 
    });
    if (!result.canceled) setEditImageUri(result.assets[0].uri);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
        const token = await AsyncStorage.getItem('token');
        const formData = new FormData();
        formData.append('name', editName);
        formData.append('breed', editBreed);
        // formData.append('weight', editWeight); 
        formData.append('note', editNote);
        formData.append('category', editCategory ? 'owned' : 'encountered');
        if (editImageUri) {
            // @ts-ignore
            formData.append('image', { uri: editImageUri, type: 'image/jpeg', name: 'update.jpg' });
        }
        await axios.put(API_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        Alert.alert("Thành công", "Đã cập nhật!");
        setIsEditing(false); fetchPetDetail(); 
    } catch (error) { Alert.alert("Lỗi", "Không lưu được."); } finally { setSaving(false); }
  };

  const pickImageForGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.5, 
    });
    if (!result.canceled) {
        setSelectedImageUri(result.assets[0].uri);
        setCaption(''); setGalleryDate(new Date()); setAddModalVisible(true);
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
        setAddModalVisible(false); fetchPetDetail();
    } catch (error) { Alert.alert("Lỗi", "Upload thất bại."); } finally { setUploading(false); }
  };

  const openEditGalleryModal = (item: any) => {
      setCurrentGalleryItem(item);
      setEditGalleryCaption(item.caption || '');
      setEditGalleryDate(new Date(item.date));
      setEditGalleryVisible(true);
  };

  const handleUpdateGalleryItem = async () => {
      if (!currentGalleryItem) return;
      setUploading(true);
      try {
          const token = await AsyncStorage.getItem('token');
          await axios.put(`${API_URL}/gallery/${currentGalleryItem._id}`, {
              caption: editGalleryCaption,
              date: editGalleryDate.toISOString()
          }, { headers: { Authorization: `Bearer ${token}` } });
          setEditGalleryVisible(false); fetchPetDetail();
      } catch (error) { Alert.alert("Lỗi", "Lỗi cập nhật."); } finally { setUploading(false); }
  };

  const handleDeleteGalleryItem = async () => {
      if (!currentGalleryItem) return;
      Alert.alert("Xóa ảnh", "Bạn có chắc muốn xóa ảnh này?", [
          { text: "Hủy", style: "cancel" },
          { text: "Xóa", style: "destructive", onPress: async () => {
              try {
                  const token = await AsyncStorage.getItem('token');
                  await axios.delete(`${API_URL}/gallery/${currentGalleryItem._id}`, {
                      headers: { Authorization: `Bearer ${token}` }
                  });
                  setEditGalleryVisible(false); fetchPetDetail();
              } catch (error) { Alert.alert("Lỗi", "Không xóa được."); }
          }}
      ]);
  };

  const handleDeleteMedicalRecord = async (recordId: string) => {
    Alert.alert("Xác nhận xóa", "Xóa hồ sơ này khỏi lịch sử?", [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa ngay", style: "destructive", onPress: async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                await axios.delete(`${API_URL}/medical/${recordId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMedicalModalVisible(false); 
                fetchPetDetail(); 
            } catch (error) { Alert.alert("Lỗi", "Không xóa được."); }
        }}
    ]);
  };

  // --- RENDERERS ---
  const renderMedicalRecord = ({ item }: any) => (
    <View style={styles.recordItem}>
        {/* Box hiển thị ngày tháng NGANG HÀNG */}
        <View style={styles.recordDateBox}>
            <Text style={styles.recordDateDay}>{new Date(item.date).getDate()}</Text>
            <Text style={styles.recordDateMonth}>/{new Date(item.date).getMonth() + 1}</Text>
        </View>

        <TouchableOpacity 
            style={styles.recordContent} 
            onPress={() => {
                setSelectedMedicalRecord(item);
                setMedicalModalVisible(true);
            }}
        >
            <Text style={styles.recordTitle}>{item.title} {item.type === 'vaccine' ? '💉' : '💊'}</Text>
            
            <View style={{marginVertical: 4}}>
                
                {item.next_appointment ? (
                    <Text style={{fontSize: 12, color: '#FF9800', fontWeight: 'bold', marginTop: 2}}>
                        ⏰ Tái khám: {new Date(item.next_appointment).toLocaleDateString('vi-VN')}
                    </Text>
                ) : null}
            </View>

            {item.description ? <Text style={styles.recordDesc} numberOfLines={1}>{item.description}</Text> : null}
        </TouchableOpacity>

        <TouchableOpacity 
            style={styles.recordMoreBtn}
            onPress={() => {
                Alert.alert(item.title, "Tùy chọn", [
                    { text: "Hủy", style: "cancel" },
                    { text: "Xem/Sửa", onPress: () => { setSelectedMedicalRecord(item); setMedicalModalVisible(true); } },
                    { text: "Xóa", style: "destructive", onPress: () => handleDeleteMedicalRecord(item._id) }
                ]);
            }}
        >
            <Ionicons name="ellipsis-horizontal" size={18} color="#ccc" />
        </TouchableOpacity>
    </View>
  );

  const renderGalleryItem = ({ item, index }: any) => {
      if (index === 0) return (
        <TouchableOpacity style={styles.addGalleryBtn} onPress={pickImageForGallery}>
            <Ionicons name="add" size={24} color="#FF6B81" />
        </TouchableOpacity>
      );
      return (
          <TouchableOpacity style={styles.galleryCard} onPress={() => openEditGalleryModal(item)}>
              <Image source={{ uri: item.img_url }} style={styles.galleryImg} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.galleryOverlay}>
                  <Text style={styles.galleryDate}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
                  {item.caption ? <Text numberOfLines={1} style={styles.galleryCaption}>{item.caption}</Text> : null}
              </LinearGradient>
          </TouchableOpacity>
      );
  };

  if (loading) return <ActivityIndicator size="large" color="#FF8E9E" style={{ marginTop: 50 }} />;
  if (!pet) return <View><Text>Không tìm thấy dữ liệu</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
          <Image source={{ uri: isEditing && editImageUri ? editImageUri : (pet.img_url || 'https://cdn-icons-png.flaticon.com/512/616/616408.png') }} style={styles.headerImg} />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.headerOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(!isEditing)}><Ionicons name={isEditing ? "checkmark" : "create-outline"} size={20} color="#fff" /></TouchableOpacity>
          {isEditing && <TouchableOpacity style={styles.camBtn} onPress={handlePickEditImage}><Ionicons name="camera" size={16} color="#fff" /></TouchableOpacity>}
      </View>

      <View style={styles.body}>
        {isEditing ? (
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeader}>Thông tin cơ bản</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Tên bé" />
                
                <View style={{flexDirection:'row', gap:10}}>
                    <TextInput style={[styles.input, {flex:1}]} value={editBreed} onChangeText={setEditBreed} placeholder="Giống" />
                    <View style={[styles.input, {flex:1, justifyContent:'center', backgroundColor:'#F0F0F0'}]}>
                        <Text style={{color:'#888'}}>⚖️ {editWeight} kg</Text>
                    </View>
                </View>
                
                <TextInput style={[styles.input, {height:60}]} value={editNote} onChangeText={setEditNote} multiline placeholder="Ghi chú" />
                <View style={styles.switchRow}>
                    <Text style={styles.switchText}>Đang nuôi</Text>
                    <Switch trackColor={{ false: "#ccc", true: "#FF9A9E" }} thumbColor={editCategory ? "#FF6B81" : "#f4f3f4"} onValueChange={setEditCategory} value={editCategory} />
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>LƯU THAY ĐỔI</Text>}
                </TouchableOpacity>
            </ScrollView>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.titleSection}>
                    <Text style={styles.name}>{pet.name}</Text>
                    <Text style={styles.meta}>{pet.species} • {pet.breed || 'Lai'} • {pet.weight || 0}kg</Text>
                    {pet.note ? <Text style={styles.note}>{pet.note}</Text> : null}
                </View>

                {pet.category === 'owned' ? (
                    <>
                        <View style={styles.menuRow}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/qrcode', params: { id: pet._id, name: pet.name } } as any)}>
                                <View style={[styles.menuIcon, {backgroundColor:'#E3F2FD'}]}><Ionicons name="qr-code" size={18} color="#2196F3"/></View>
                                <Text style={styles.menuText}>QR Code</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/diet-plan', params: { petId: pet._id } } as any)}>
                                <View style={[styles.menuIcon, {backgroundColor:'#E8F5E9'}]}><Ionicons name="nutrition" size={18} color="#4CAF50"/></View>
                                <Text style={styles.menuText}>Ăn uống</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/weight-chart', params: { petId: pet._id } } as any)}>
                                <View style={[styles.menuIcon, {backgroundColor:'#F3E5F5'}]}><Ionicons name="scale" size={18} color="#9C27B0"/></View>
                                <Text style={styles.menuText}>Cân nặng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/add-medical', params: { petId: pet._id } } as any)}>
                                <View style={[styles.menuIcon, {backgroundColor:'#FFF3E0'}]}><Ionicons name="medkit" size={18} color="#FF9800"/></View>
                                <Text style={styles.menuText}>Sức khỏe</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionHeader}>Hành trình lớn khôn</Text>
                        <FlatList horizontal data={[{ id: 'add-btn' }, ...(pet.gallery || []).slice().reverse()]} renderItem={renderGalleryItem} showsHorizontalScrollIndicator={false} style={{marginBottom: 15}} />

                        <Text style={styles.sectionHeader}>Lịch sử y tế</Text>
                        <FlatList data={pet.medical_records?.reverse() || []} renderItem={renderMedicalRecord} scrollEnabled={false} />
                    </>
                ) : (
                    <View style={styles.adoptBox}>
                        <Ionicons name="heart" size={40} color="#FF6B81" style={{marginBottom:10}}/>
                        <Text style={styles.adoptTitle}>Bạn đã gặp bé này!</Text>
                        <Text style={styles.adoptDesc}>Nếu bạn quyết định nhận nuôi, hãy bấm nút chỉnh sửa (bút chì) ở trên và bật chế độ "Đang nuôi" nhé.</Text>
                    </View>
                )}
                <View style={{height: 40}}/>
            </ScrollView>
        )}
      </View>

      {/* --- MODAL 1: ADD GALLERY --- */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible} onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalBg}>
            <View style={styles.modalCard}>
                <Text style={styles.modalHeader}>Thêm ảnh mới</Text>
                <Image source={{ uri: selectedImageUri }} style={styles.modalImg} />
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
                    <Text style={styles.dateText}>{galleryDate.toLocaleDateString('vi-VN')}</Text>
                    <Ionicons name="calendar" size={16} color="#666"/>
                </TouchableOpacity>
                {showDatePicker && <DateTimePicker value={galleryDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setGalleryDate(d); }} />}
                <TextInput style={styles.modalInput} placeholder="Viết chú thích..." value={caption} onChangeText={setCaption} />
                <View style={styles.modalActions}>
                    <TouchableOpacity onPress={() => setAddModalVisible(false)}><Text style={styles.cancelText}>Hủy</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleUploadGallery}><Text style={styles.confirmText}>Đăng</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* --- MODAL 2: EDIT GALLERY --- */}
      <Modal animationType="fade" transparent={true} visible={editGalleryVisible} onRequestClose={() => setEditGalleryVisible(false)}>
        <View style={styles.modalBg}>
            <View style={styles.modalCard}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                    <Text style={styles.modalHeader}>Chi tiết ảnh</Text>
                    <TouchableOpacity onPress={handleDeleteGalleryItem}><Ionicons name="trash" size={20} color="red"/></TouchableOpacity>
                </View>
                {currentGalleryItem && <Image source={{ uri: currentGalleryItem.img_url }} style={styles.modalImg} resizeMode="contain"/>}
                <TouchableOpacity onPress={() => setShowEditGalleryDatePicker(true)} style={styles.dateBtn}>
                    <Text style={styles.dateText}>{editGalleryDate.toLocaleDateString('vi-VN')}</Text>
                    <Ionicons name="calendar" size={16} color="#666"/>
                </TouchableOpacity>
                {showEditGalleryDatePicker && <DateTimePicker value={editGalleryDate} mode="date" onChange={(e, d) => { setShowEditGalleryDatePicker(false); if(d) setEditGalleryDate(d); }} />}
                <TextInput style={styles.modalInput} placeholder="Sửa chú thích..." value={editGalleryCaption} onChangeText={setEditGalleryCaption} />
                <View style={styles.modalActions}>
                    <TouchableOpacity onPress={() => setEditGalleryVisible(false)}><Text style={styles.cancelText}>Đóng</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleUpdateGalleryItem}><Text style={styles.confirmText}>Cập nhật</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* --- MODAL 3: MEDICAL DETAIL --- */}
      <Modal animationType="slide" transparent={true} visible={medicalModalVisible} onRequestClose={() => setMedicalModalVisible(false)}>
        <View style={styles.modalBg}>
            <View style={styles.modalCard}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                    <Text style={styles.modalHeader}>Chi tiết hồ sơ</Text>
                    <View style={{flexDirection:'row'}}>
                        <TouchableOpacity onPress={() => handleDeleteMedicalRecord(selectedMedicalRecord?._id)} style={{marginRight: 15}}>
                            <Ionicons name="trash-outline" size={22} color="#FF6B81"/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMedicalModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#666"/>
                        </TouchableOpacity>
                    </View>
                </View>

                {selectedMedicalRecord && (
                    <ScrollView showsVerticalScrollIndicator={false} style={{maxHeight: 400}}>
                        {selectedMedicalRecord.img_url ? (
                            <Image source={{ uri: selectedMedicalRecord.img_url }} style={{width:'100%', height: 200, borderRadius: 10, marginBottom: 15, resizeMode:'contain'}} />
                        ) : null}

                        <Text style={styles.detailTitle}>{selectedMedicalRecord.title}</Text>
                        
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={16} color="#FF6B81"/>
                            <Text style={styles.detailText}> Ngày khám: {new Date(selectedMedicalRecord.date).toLocaleDateString('vi-VN')}</Text>
                        </View>

                        {selectedMedicalRecord.doctor ? (
                            <View style={styles.detailRow}>
                                <Ionicons name="person-outline" size={16} color="#FF6B81"/>
                                <Text style={styles.detailText}> Bác sĩ: {selectedMedicalRecord.doctor}</Text>
                            </View>
                        ) : null}

                        {selectedMedicalRecord.next_appointment ? (
                            <View style={[styles.detailRow, {backgroundColor:'#FFF0F3', padding:8, borderRadius:5}]}>
                                <Ionicons name="alarm-outline" size={16} color="#FF6B81"/>
                                <Text style={[styles.detailText, {color:'#FF6B81', fontWeight:'bold'}]}> Tái khám: {new Date(selectedMedicalRecord.next_appointment).toLocaleDateString('vi-VN')}</Text>
                            </View>
                        ) : null}

                        <Text style={styles.detailLabel}>Nội dung / Chẩn đoán:</Text>
                        <Text style={styles.detailDesc}>{selectedMedicalRecord.description}</Text>
                    </ScrollView>
                )}

                <TouchableOpacity 
                    style={styles.detailEditBtn} 
                    onPress={() => {
                        setMedicalModalVisible(false);
                        router.push({ 
                            pathname: '/edit-medical', 
                            params: { petId: pet._id, recordId: selectedMedicalRecord._id, oldData: JSON.stringify(selectedMedicalRecord) } 
                        } as any);
                    }}
                >
                    <Ionicons name="create-outline" size={20} color="#fff"/>
                    <Text style={{color:'#fff', fontWeight:'bold', marginLeft:5}}>CHỈNH SỬA</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { height: 260, width: '100%' },
  headerImg: { width: '100%', height: '100%' },
  headerOverlay: { ...StyleSheet.absoluteFillObject },
  backBtn: { position: 'absolute', top: 50, left: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
  editBtn: { position: 'absolute', top: 50, right: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
  camBtn: { position: 'absolute', bottom: 20, right: 20, padding: 10, backgroundColor: '#FF6B81', borderRadius: 20 },
  body: { flex: 1, marginTop: -25, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20, paddingTop: 20 },
  titleSection: { marginBottom: 20, alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  meta: { fontSize: 13, color: '#888', marginTop: 4, fontWeight: '500' },
  note: { fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuItem: { alignItems: 'center' },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  menuText: { fontSize: 11, color: '#555', fontWeight: '600' },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 5 },
  addGalleryBtn: { width: 90, height: 110, borderRadius: 12, borderWidth: 1, borderColor: '#FF9A9E', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#FFF5F7' },
  galleryCard: { width: 90, height: 110, borderRadius: 12, marginRight: 10, overflow: 'hidden', backgroundColor: '#eee' },
  galleryImg: { width: '100%', height: '100%' },
  galleryOverlay: { position: 'absolute', bottom: 0, width: '100%', padding: 6 },
  galleryDate: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  galleryCaption: { color: '#eee', fontSize: 8, fontStyle: 'italic' },
  
  // 👇 STYLE MỚI CHO DATE BOX NGANG HÀNG
  recordItem: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 3, elevation: 1, alignItems: 'center' },
  
  recordDateBox: { 
      width: 60, // Tăng width để chứa ngang
      flexDirection: 'row', // Xếp ngang
      alignItems: 'baseline', // Căn chân chữ
      justifyContent: 'center', 
      borderRightWidth: 1, 
      borderRightColor: '#eee', 
      marginRight: 10,
      paddingRight: 5 
  },
  recordDateDay: { 
      fontSize: 18, 
      fontWeight: 'bold', 
      color: '#FF6B81' 
  },
  recordDateMonth: { 
      fontSize: 14, 
      color: '#999',
      fontWeight: '600'
  },
  
  recordContent: { flex: 1 },
  recordTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  recordDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  recordMoreBtn: { padding: 10 },
  
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#555', marginLeft: 8 },
  detailLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5 },
  detailDesc: { fontSize: 14, color: '#666', lineHeight: 22, backgroundColor: '#FAFAFA', padding: 10, borderRadius: 8 },
  detailEditBtn: { flexDirection: 'row', backgroundColor: '#FF6B81', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  input: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 10, fontSize: 14, marginBottom: 10, color: '#333' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 10, borderRadius: 10, marginBottom: 20 },
  switchText: { fontSize: 14, fontWeight: '600', color: '#333' },
  saveBtn: { backgroundColor: '#FF6B81', padding: 12, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  adoptBox: { backgroundColor: '#FFF3E0', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  adoptTitle: { fontSize: 16, fontWeight: 'bold', color: '#E65100', marginBottom: 5 },
  adoptDesc: { fontSize: 12, color: '#E65100', textAlign: 'center', lineHeight: 18 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 5, maxHeight: '80%' },
  modalHeader: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  modalImg: { width: '100%', height: 180, borderRadius: 10, marginBottom: 15, backgroundColor: '#eee' },
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#F8F9FA', borderRadius: 8, marginBottom: 10 },
  dateText: { fontSize: 13, color: '#333' },
  modalInput: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  cancelText: { color: '#999', fontSize: 14, fontWeight: '600' },
  confirmText: { color: '#FF6B81', fontSize: 14, fontWeight: 'bold' }
});