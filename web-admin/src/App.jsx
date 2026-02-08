import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

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
  searchParams: { padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '20px' },
  loginContainer: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eef2f5' },
  loginBox: { width: '400px', padding: '40px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' },
  button: { width: '100%', padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: 'red', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px' },
  
  // Style cho Modal (Popup)
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { width: '400px', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 20px 0', color: '#2c3e50' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' }
};

const BASE_URL = 'https://petcare-api-tuyet.onrender.com/api'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPets: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Create User State
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setIsLoggedIn(true);
      fetchDashboardData();
    }
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
      if (res.data) {
        if (email !== 'tuyet@test.com') {
           setLoginError('⛔ Bạn không có quyền truy cập Admin!');
           setLoading(false);
           return;
        } 
        localStorage.setItem('adminToken', res.data.token);
        setIsLoggedIn(true);
        fetchDashboardData();
      }
    } catch (error) {
      setLoginError('Sai email hoặc mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setUsers([]);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/users-stats`);
      if (res.data.success) {
        setUsers(res.data.data);
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CHỨC NĂNG TẠO USER MỚI ---
  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword) {
        alert("Vui lòng nhập đủ thông tin!");
        return;
    }
    try {
        const res = await axios.post(`${BASE_URL}/admin/create-user`, {
            name: newName,
            email: newEmail,
            password: newPassword
        });
        if (res.data.success) {
            alert("✅ " + res.data.message);
            setShowModal(false); // Đóng modal
            setNewName(''); setNewEmail(''); setNewPassword(''); // Reset form
            fetchDashboardData(); // Tải lại danh sách
        }
    } catch (error) {
        alert("❌ Lỗi: " + (error.response?.data?.message || "Không thể tạo user"));
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h2 style={{color: '#2c3e50', marginBottom: '20px'}}>PetCare Admin 🛡️</h2>
          {loginError && <div style={styles.error}>{loginError}</div>}
          <input type="email" placeholder="Email quản trị viên" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)}/>
          <input type="password" placeholder="Mật khẩu" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)}/>
          <button style={styles.button} onClick={handleLogin} disabled={loading}>ĐĂNG NHẬP QUẢN TRỊ</button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const name = user.name || '';
    const email = user.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Xin chào, Tuyết! 👋</h1>
          <p style={{color: '#7f8c8d'}}>Hệ thống quản trị viên cao cấp</p>
        </div>
        <div style={{display:'flex', gap: '10px'}}>
            {/* 👇 NÚT TẠO TÀI KHOẢN MỚI */}
            <button onClick={() => setShowModal(true)} style={{padding: '10px 20px', cursor:'pointer', backgroundColor:'#27ae60', color:'white', border:'none', borderRadius:'5px', fontWeight:'bold'}}>
                Tạo tài khoản ➕
            </button>
            <button onClick={fetchDashboardData} style={{padding: '10px 20px', cursor:'pointer', backgroundColor:'#3498db', color:'white', border:'none', borderRadius:'5px'}}>Làm mới 🔄</button>
            <button onClick={handleLogout} style={{padding: '10px 20px', cursor:'pointer', backgroundColor:'#e74c3c', color:'white', border:'none', borderRadius:'5px'}}>Đăng xuất 🚪</button>
        </div>
      </div>

      <div style={styles.cardContainer}>
        <div style={styles.card}><div style={styles.cardLabel}>Tổng người dùng</div><div style={styles.cardValue}>{stats.totalUsers}</div></div>
        <div style={styles.card}><div style={styles.cardLabel}>Tổng thú cưng</div><div style={styles.cardValue}>{stats.totalPets}</div></div>
        <div style={styles.card}><div style={styles.cardLabel}>Tỷ lệ sở hữu</div><div style={styles.cardValue}>{stats.totalUsers > 0 ? (stats.totalPets / stats.totalUsers).toFixed(1) : 0}</div></div>
      </div>

      <div style={styles.tableContainer}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3>Danh sách người dùng ({filteredUsers.length})</h3>
          <input type="text" placeholder="Tìm theo tên hoặc email..." style={styles.searchParams} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
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
                  <span style={{...styles.badge, backgroundColor: user.petCount > 0 ? '#e3f2fd' : '#f5f5f5', color: user.petCount > 0 ? '#2196f3' : '#999'}}>
                    {user.petCount} 🐾
                  </span>
                </td>
                <td style={styles.td}><span style={{...styles.badge, backgroundColor:'#e8f5e9', color:'#2e7d32'}}>Hoạt động</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 👇 MODAL TẠO TÀI KHOẢN (POPUP) */}
      {showModal && (
          <div style={styles.modalOverlay}>
              <div style={styles.modalBox}>
                  <h3 style={styles.modalTitle}>Tạo tài khoản mới ✨</h3>
                  <input placeholder="Họ và tên" style={styles.input} value={newName} onChange={e => setNewName(e.target.value)} />
                  <input placeholder="Email đăng nhập" style={styles.input} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  <input placeholder="Mật khẩu" type="password" style={styles.input} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  
                  <div style={styles.modalActions}>
                      <button onClick={handleCreateUser} style={{...styles.button, backgroundColor: '#27ae60'}}>Tạo ngay</button>
                      <button onClick={() => setShowModal(false)} style={{...styles.button, backgroundColor: '#95a5a6'}}>Hủy</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;