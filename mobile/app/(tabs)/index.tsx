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
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function HomeScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const API_URL = 'https://petcare-api-tuyet.onrender.com/api/pets';

  // Dùng useFocusEffect để khi quay lại tab này thì tự load lại danh sách
  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [])
  );

  const fetchPets = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Kiểm tra token, nếu mất thì đá về Login
      if (!token) {
         router.replace('/(auth)/login' as any);
         return;
      }
      
      const response = await axios.get(API_URL, {
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
        const speciesData = item.species ? item.species.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1 || speciesData.indexOf(textData) > -1;
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

  const renderPetItem = ({ item, index }: any) => (
    <Animatable.View animation="fadeInUp" duration={1000} delay={index * 150}>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 👇 Header đã được dọn dẹp sạch sẽ */}
      <LinearGradient
        colors={['#FF9A9E', '#FECFEF']} 
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Thú Cưng 🐾</Text>
        {/* Đã xóa các nút chức năng ở đây */}
      </LinearGradient>

      {/* Thanh tìm kiếm */}
      <Animatable.View animation="fadeInDown" delay={500} style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc loài..."
            value={searchText}
            onChangeText={handleSearch}
        />
      </Animatable.View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF8E9E" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredPets}
          keyExtractor={(item) => item._id}
          renderItem={renderPetItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPets(); }} colors={['#FF8E9E']} />
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
              {searchText ? 'Không tìm thấy bé nào khớp lệnh.' : 'Danh sách trống. Thêm ngay nhé!'}
            </Text>
          }
        />
      )}
      
      <Animatable.View animation="bounceIn" delay={1000} style={styles.fabContainer}>
        <TouchableOpacity 
            style={styles.fab}
            onPress={() => router.push('/add-pet' as any)}
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
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', // Đã sửa thành Center cho tiêu đề nằm giữa
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 5,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.1)', textShadowRadius: 5 },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 20, marginTop: -20, 
    paddingHorizontal: 15, borderRadius: 15, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },

  listContainer: { padding: 20, paddingTop: 10, paddingBottom: 100 },
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
  tagText: { 
    fontSize: 12, color: '#FF6B81', backgroundColor: '#FFF0F3', fontWeight: '600',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 5, overflow: 'hidden'
  },
  deleteButton: { padding: 10, backgroundColor: '#FAFAFA', borderRadius: 10, marginLeft: 5 },
  actionIcon: { fontSize: 18 },
  
  fabContainer: { position: 'absolute', bottom: 30, right: 30 },
  fab: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FF6B81',
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: "#FF6B81", shadowOpacity: 0.4, shadowRadius: 5
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginTop: -4 }
});