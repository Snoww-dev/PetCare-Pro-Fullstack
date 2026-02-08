import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

// Cấu hình CSS inline đơn giản để không cần cài Tailwind/Bootstrap
const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { color: '#2c3e50', margin: 0 },
  cardContainer: { display: 'flex', gap: '20px', marginBottom: '30px' },
  card: { flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center' },
  cardValue: { fontSize: '36px', fontWeight: 'bold', color: '#3498db', margin: '10px 0' },
  cardLabel: { color: '#7f8c8d', fontSize: '14px', textTransform: 'uppercase' },
  tableContainer: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', borderBottom: '2px solid #eee', color: '#7f8c8d' },
  td: { padding: '15px', borderBottom: '1px solid #eee', color: '#2c3e50' },
  badge: { padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  searchParams: { padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '20px' }
};

function App() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPets: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Thay đổi URL này thành URL backend của bạn
  const API_URL = 'http://localhost:5000/api/admin/users-stats'; 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) {
        setUsers(res.data.data);
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
      alert("Không thể kết nối tới Server!");
    } finally {
      setLoading(false);
    }
  };

  // Logic tìm kiếm
  // Logic tìm kiếm (Đã sửa lỗi crash khi thiếu tên/email)
  const filteredUsers = users.filter(user => {
    const name = user.name || '';   // Nếu không có tên thì coi là chuỗi rỗng
    const email = user.email || ''; // Nếu không có email thì coi là chuỗi rỗng
    
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <div style={{textAlign:'center', marginTop: 50}}>Đang tải dữ liệu...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>PetCare Admin Dashboard 🛡️</h1>
          <p style={{color: '#7f8c8d'}}>Quản lý người dùng và hệ thống</p>
        </div>
        <button onClick={fetchData} style={{padding: '10px 20px', cursor:'pointer', backgroundColor:'#3498db', color:'white', border:'none', borderRadius:'5px'}}>
          Làm mới 🔄
        </button>
      </div>

      {/* Thẻ Thống kê (Cards) */}
      <div style={styles.cardContainer}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Tổng người dùng</div>
          <div style={styles.cardValue}>{stats.totalUsers}</div>
          <div style={{color:'#2ecc71'}}>👤 Active Users</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Tổng thú cưng</div>
          <div style={styles.cardValue}>{stats.totalPets}</div>
          <div style={{color:'#e67e22'}}>🐾 Registered Pets</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Tỷ lệ sở hữu</div>
          <div style={styles.cardValue}>
            {stats.totalUsers > 0 ? (stats.totalPets / stats.totalUsers).toFixed(1) : 0}
          </div>
          <div style={{color:'#9b59b6'}}>📊 Pet / User</div>
        </div>
      </div>

      {/* Bảng Danh sách User */}
      <div style={styles.tableContainer}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3>Danh sách người dùng ({filteredUsers.length})</h3>
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc email..." 
            style={styles.searchParams}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Tên người dùng</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Ngày tham gia</th>
              <th style={styles.th}>Số lượng Pet</th>
              <th style={styles.th}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user._id}>
                <td style={styles.td}>#{index + 1}</td>
                <td style={styles.td}>
                  <div style={{fontWeight:'bold'}}>{user.name}</div>
                  <div style={{fontSize:'12px', color:'#aaa'}}>{user._id}</div>
                </td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{format(new Date(user.createdAt), 'dd/MM/yyyy')}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge, 
                    backgroundColor: user.petCount > 0 ? '#e3f2fd' : '#f5f5f5',
                    color: user.petCount > 0 ? '#2196f3' : '#999'
                  }}>
                    {user.petCount} 🐾
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{...styles.badge, backgroundColor:'#e8f5e9', color:'#2e7d32'}}>Hoạt động</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div style={{textAlign:'center', padding: 20, color: '#999'}}>Không tìm thấy user nào.</div>
        )}
      </div>
    </div>
  );
}

export default App;