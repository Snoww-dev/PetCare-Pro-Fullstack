import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HelpScreen() {
  const router = useRouter();

  const renderFaqItem = (icon: any, color: string, title: string, content: string) => (
    <View style={styles.faqItem}>
      <View style={styles.faqHeader}>
        <View style={[styles.iconBox, { backgroundColor: color }]}>
            <Ionicons name={icon} size={20} color="#fff" />
        </View>
        <Text style={styles.faqTitle}>{title}</Text>
      </View>
      <Text style={styles.faqContent}>{content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hướng dẫn sử dụng 💡</Text>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Banner chào mừng */}
        <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.banner}>
            <Text style={styles.bannerTitle}>Chào mừng bạn đến với PetCare Pro!</Text>
            <Text style={styles.bannerText}>Dưới đây là các hướng dẫn cơ bản để bạn chăm sóc thú cưng tốt hơn.</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>

        {/* Danh sách hướng dẫn */}
        {renderFaqItem(
            'paw', 
            '#FF6B81', 
            'Làm sao để thêm thú cưng?', 
            'Tại màn hình "Trang chủ", bạn bấm vào nút dấu cộng (+) màu hồng ở góc dưới bên phải màn hình. Sau đó điền tên, loài, giống và tải ảnh đại diện lên.'
        )}

        {renderFaqItem(
            'medkit', 
            '#4CAF50', 
            'Thêm lịch sử khám bệnh/tiêm phòng?', 
            'Bấm vào thú cưng bạn muốn thêm hồ sơ -> Chọn nút "+ Thêm" ở mục Hồ sơ sức khỏe. Tại đây bạn có thể chọn ngày, loại khám (tiêm/khám bệnh) và tải ảnh đơn thuốc.'
        )}

        {renderFaqItem(
            'images', 
            '#2196F3', 
            'Bộ sưu tập "Hành trình lớn khôn" là gì?', 
            'Đây là nơi lưu giữ những khoảnh khắc đáng yêu của bé. Trong trang chi tiết thú cưng, bấm vào nút "+" ở mục Hành trình lớn khôn để tải ảnh lên kèm ngày tháng.'
        )}

        {renderFaqItem(
            'qr-code', 
            '#FF9800', 
            'Mã QR dùng để làm gì?', 
            'Mỗi thú cưng có một mã QR riêng. Bạn có thể in mã này ra và đeo vào cổ cho bé. Nếu bé đi lạc, người tìm thấy có thể quét mã để gọi điện cho bạn.'
        )}

        {/* Thông tin liên hệ */}
        <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Vẫn cần hỗ trợ?</Text>
            <Text style={styles.contactText}>Liên hệ đội ngũ kỹ thuật:</Text>
            <TouchableOpacity style={styles.contactBtn}>
                <Ionicons name="mail" size={20} color="#FF6B81" />
                <Text style={styles.contactBtnText}>support@petcare.com</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', elevation: 2 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  banner: { margin: 20, padding: 20, borderRadius: 20, marginBottom: 10 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  bannerText: { color: '#fff', fontSize: 14, opacity: 0.9 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginTop: 10, marginBottom: 15, color: '#333' },

  faqItem: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 15, elevation: 2 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  faqTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  faqContent: { fontSize: 14, color: '#666', lineHeight: 22, marginLeft: 40 },

  contactSection: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  contactTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  contactText: { color: '#666', marginVertical: 5 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F3', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: '#FF9A9E' },
  contactBtnText: { color: '#FF6B81', fontWeight: 'bold', marginLeft: 8 }
});