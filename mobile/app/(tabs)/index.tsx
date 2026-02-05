import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // 👇 State quản lý Tab: 'owned' (Đang nuôi) hoặc 'encountered' (Gặp trên đường)
  const [activeTab, setActiveTab] = useState<'owned' | 'encountered'>('owned');

  const router = useRouter();
  const API_URL = 'https://petcare-api-tuyet.onrender.com/api/pets';

  // Load lại khi quay lại màn hình hoặc khi đổi Tab
  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [activeTab]) // Khi activeTab thay đổi sẽ gọi lại API
  );

  const fetchPets = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
         router.replace('/(auth)/login' as any);
         return;
      }
      
      // 👇 Gọi API kèm theo category
      const response = await axios.get(`${API_URL}?category=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPets(response.data.data);
      setFilteredPets(response.data.data);
    } catch (error) {
      console.log('Lỗi lấy danh sách:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text) {
      const newData = pets.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
        return itemData.indexOf(text.toUpperCase()) > -1;
      });
      setFilteredPets(newData);
    } else {
      setFilteredPets(pets);
    }
  };

  const handleDeletePet = (petId: string, petName: string) => {
    Alert.alert(
      "Xác nhận xóa 🐾",
      `Bạn có chắc chắn muốn xóa bé ${petName} không?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa ngay", 
          style: "destructive", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/${petId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert("Thành công", `Đã xóa bé ${petName}.`);
              fetchPets();
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa thú cưng lúc này.");
            }
          } 
        }
      ]
    );
  };

  // --- RENDER 1: GIAO DIỆN "ĐANG NUÔI" (Chi tiết) ---
  const renderOwnedItem = ({ item, index }: any) => (
    <Animatable.View animation="fadeInUp" duration={800} delay={index * 100}>
        <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push({ pathname: '/pet-detail', params: { id: item._id } } as any)}
        >
            <View style={styles.cardContent}>
                <Image 
                    source={{ uri: item.img_url || 'https://cdn-icons-png.flaticon.com/512/616/616408.png' }} 
                    style={styles.petImage} 
                />
                <View style={styles.petInfo}>
                    <Text style={styles.petName}>{item.name}</Text>
                    <Text style={styles.petDetail}>{item.species} - {item.breed}</Text>
                    <View style={styles.tagContainer}>
                        <Text style={styles.tagText}>{item.gender === 'male' ? '♂️ Đực' : '♀️ Cái'}</Text>
                        <Text style={styles.tagText}>{item.weight} kg</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={() => handleDeletePet(item._id, item.name)}
                    style={styles.deleteButton}
                >
                    <Text style={styles.actionIcon}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    </Animatable.View>
  );

  // --- RENDER 2: GIAO DIỆN "GẶP TRÊN ĐƯỜNG" (Album ảnh đơn giản) ---
  const renderEncounteredItem = ({ item, index }: any) => (
    <Animatable.View animation="zoomIn" duration={600} delay={index * 50} style={styles.gridItemContainer}>
        <TouchableOpacity 
            style={styles.gridCard}
            // Vẫn cho bấm vào xem chi tiết, hoặc bạn có thể chỉ cho xem ảnh to
            onPress={() => router.push({ pathname: '/pet-detail', params: { id: item._id } } as any)}
        >
            <Image 
                source={{ uri: item.img_url || 'https://cdn-icons-png.flaticon.com/512/616/616408.png' }} 
                style={styles.gridImage} 
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.gridOverlay}>
                <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleDeletePet(item._id, item.name)} style={{position: 'absolute', top: 5, right: 5}}>
                     <Text style={{fontSize: 12}}>🗑️</Text>
                </TouchableOpacity>
            </LinearGradient>
        </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <LinearGradient
        colors={['#FF9A9E', '#FECFEF']} 
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        style={styles.header}
      >
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.headerTitle}>Thú Cưng</Text>
            <Image source={require('../../assets/images/logo-home.png')} style={{ width: 32, height: 32, marginLeft: 5, resizeMode: 'contain' }} />
        </View>

        {/* 👇 THANH CHUYỂN TAB (SEGMENTED CONTROL) */}
        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'owned' && styles.activeTab]}
                onPress={() => setActiveTab('owned')}
            >
                <Text style={[styles.tabText, activeTab === 'owned' && styles.activeTabText]}>🏠 Đang nuôi</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'encountered' && styles.activeTab]}
                onPress={() => setActiveTab('encountered')}
            >
                <Text style={[styles.tabText, activeTab === 'encountered' && styles.activeTabText]}>📸 Đã gặp</Text>
            </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* TÌM KIẾM */}
      <Animatable.View animation="fadeInDown" delay={500} style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'owned' ? "Tìm theo tên, loài..." : "Tìm thú cưng đã gặp..."}
            value={searchText}
            onChangeText={handleSearch}
        />
      </Animatable.View>

      {/* DANH SÁCH */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF8E9E" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          // 👇 Quan trọng: Thay đổi key để FlatList vẽ lại hoàn toàn khi đổi dạng hiển thị
          key={activeTab === 'owned' ? 'list-view' : 'grid-view'} 
          data={filteredPets}
          keyExtractor={(item) => item._id}
          
          // 👇 Nếu là tab "Đã gặp" thì dùng 2 cột, tab "Đang nuôi" dùng 1 cột
          numColumns={activeTab === 'encountered' ? 2 : 1}
          
          renderItem={activeTab === 'owned' ? renderOwnedItem : renderEncounteredItem}
          
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPets(); }} colors={['#FF8E9E']} />
          }
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 50}}>
                <Text style={{ fontSize: 40 }}>😿</Text>
                <Text style={{ textAlign: 'center', color: '#999', marginTop: 10 }}>
                    {activeTab === 'owned' ? 'Bạn chưa nuôi bé nào.' : 'Chưa gặp bé nào trên đường.'}
                </Text>
            </View>
          }
        />
      )}
      
      {/* NÚT THÊM (+) */}
      <Animatable.View animation="bounceIn" delay={1000} style={styles.fabContainer}>
        <TouchableOpacity 
            style={styles.fab}
            // 👇 Truyền category hiện tại sang trang AddPet để biết đang thêm loại nào
            onPress={() => router.push({ pathname: '/add-pet', params: { category: activeTab } } as any)}
        >
            <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F3' },
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    alignItems: 'center', 
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 5,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  
  // Styles cho Tab
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 25, marginTop: 15, padding: 4 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 25, borderRadius: 20 },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  activeTabText: { color: '#FF6B81' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 20, marginTop: -20, // Kéo lên đè header xíu cho đẹp
    paddingHorizontal: 15, borderRadius: 15, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },

  listContainer: { padding: 15, paddingBottom: 100 },
  
  // Styles cho Card Đang nuôi (List View)
  card: {
    backgroundColor: '#ffffff', borderRadius: 15, marginBottom: 15, padding: 15,
    shadowColor: "#FF8E9E", shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  petImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: '#eee' },
  petInfo: { marginLeft: 15, flex: 1 },
  petName: { fontSize: 19, fontWeight: 'bold', color: '#333' },
  petDetail: { fontSize: 14, color: '#666', marginTop: 2 },
  tagContainer: { flexDirection: 'row', marginTop: 8 },
  tagText: { fontSize: 12, color: '#FF6B81', backgroundColor: '#FFF0F3', fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 5, overflow: 'hidden' },
  deleteButton: { padding: 10, backgroundColor: '#FAFAFA', borderRadius: 10, marginLeft: 5 },
  actionIcon: { fontSize: 18 },

  // Styles cho Card Đã gặp (Grid View / Album)
  gridItemContainer: { flex: 1, margin: 5, maxWidth: (width - 40) / 2 },
  gridCard: { borderRadius: 15, overflow: 'hidden', height: 160, backgroundColor: '#fff', elevation: 3 },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gridOverlay: { position: 'absolute', bottom: 0, width: '100%', padding: 10, justifyContent: 'flex-end' },
  gridName: { color: '#fff', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 },

  fabContainer: { position: 'absolute', bottom: 30, right: 30 },
  fab: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FF6B81',
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: "#FF6B81", shadowOpacity: 0.4, shadowRadius: 5
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginTop: -4 }
});