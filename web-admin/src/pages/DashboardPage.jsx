import React, { useEffect, useState } from 'react';
import { Layout, Table, Card, Statistic, Button, Tag, Space, Modal, Form, Input, message, ConfigProvider, Avatar } from 'antd'; // 👈 Đã thêm Avatar
import { UserOutlined, LogoutOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const { Header, Content } = Layout;

const DashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPets: 0 });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Link API
  const BASE_URL = 'https://petcare-api-tuyet.onrender.com/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/users-stats`);
      if (res.data.success) {
        setUsers(res.data.data);
        setStats(res.data.stats);
      }
    } catch (error) {
      message.error("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const handleCreateUser = async (values) => {
    try {
      const res = await axios.post(`${BASE_URL}/admin/create-user`, values);
      if (res.data.success) {
        message.success("Tạo user thành công! 🎉");
        setIsModalOpen(false);
        form.resetFields();
        fetchData();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi rồi!");
    }
  };

  const handleUpdateRole = async (userId, currentRole, userName) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    Modal.confirm({
      title: `Xác nhận thay đổi quyền?`,
      content: `Bạn có muốn đổi "${userName}" thành ${newRole.toUpperCase()} không?`,
      okText: 'Đồng ý',
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await axios.put(`${BASE_URL}/admin/update-role`, { userId, newRole });
          message.success("Cập nhật quyền thành công!");
          fetchData();
        } catch (error) {
          message.error("Lỗi cập nhật!");
        }
      }
    });
  };

  // Cấu hình các cột cho Bảng (Table)
  const columns = [
    { 
        title: 'Avatar', 
        dataIndex: 'img_url', 
        key: 'avatar',
        render: (url) => <Avatar src={url} icon={<UserOutlined />} size="large" style={{border: '2px solid #ff69b4'}} />
    },
    { title: 'Tên người dùng', dataIndex: 'name', key: 'name', render: (text) => <b>{text}</b> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Ngày tham gia', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date) => <span style={{color: '#888'}}>{format(new Date(date), 'dd/MM/yyyy')}</span>
    },
    { 
      title: 'Vai trò', 
      key: 'role',
      render: (_, record) => {
        const isBoss = record.email === 'tuyet@test.com'; 
        if (isBoss || record.role === 'admin') {
            return <Tag color="gold" style={{ padding: '5px 10px', borderRadius: 10 }}>👑 ADMIN</Tag>;
        }
        return <Tag color="default" style={{ padding: '5px 10px', borderRadius: 10 }}>👤 User</Tag>;
      }
    },
    { 
      title: 'Thú cưng', 
      dataIndex: 'petCount', 
      key: 'petCount',
      render: (count) => <Tag color={count > 0 ? "success" : "default"}>{count} 🐾</Tag>
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        const isBoss = record.email === 'tuyet@test.com';
        if (isBoss) return null; 
        return (
          <Button 
            size="small" 
            type={record.role === 'admin' ? 'dashed' : 'primary'} 
            danger={record.role === 'admin'}
            onClick={() => handleUpdateRole(record._id, record.role, record.name)}
          >
            {record.role === 'admin' ? 'Hủy quyền' : 'Thăng chức'}
          </Button>
        );
      }
    },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#ff69b4', borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ color: '#ff69b4', margin: 0 }}>PetCare Admin 💖</h2>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Thêm User</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>Thoát</Button>
          </Space>
        </Header>
        
        <Content style={{ margin: '24px 40px' }}>
          <Space size="large" style={{ display: 'flex', marginBottom: 24, width: '100%' }}>
            <Card style={{ flex: 1, textAlign: 'center', borderRadius: 15 }} hoverable>
              <Statistic title="Tổng Users" value={stats.totalUsers} prefix={<UserOutlined />} valueStyle={{ color: '#ff69b4' }} />
            </Card>
            <Card style={{ flex: 1, textAlign: 'center', borderRadius: 15 }} hoverable>
              <Statistic title="Tổng Pets" value={stats.totalPets} prefix="🐾" valueStyle={{ color: '#ff9f43' }} />
            </Card>
            <Card style={{ flex: 1, textAlign: 'center', borderRadius: 15 }} hoverable>
              <Statistic title="Tỷ lệ sở hữu" value={stats.totalUsers ? (stats.totalPets/stats.totalUsers).toFixed(1) : 0} prefix="📊" valueStyle={{ color: '#9b59b6' }} />
            </Card>
          </Space>

          <Card style={{ borderRadius: 15, boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
             <Table 
                columns={columns} 
                dataSource={users} 
                rowKey="_id" 
                loading={loading}
                pagination={{ pageSize: 5 }} 
             />
          </Card>
        </Content>

        <Modal title="Tạo tài khoản mới ✨" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
          <Form form={form} onFinish={handleCreateUser} layout="vertical">
            <Form.Item name="name" label="Họ tên" rules={[{ required: true }]}> <Input /> </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}> <Input /> </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}> <Input.Password /> </Form.Item>
            <Button type="primary" htmlType="submit" block>Tạo ngay</Button>
          </Form>
        </Modal>

      </Layout>
    </ConfigProvider>
  );
};

export default DashboardPage;