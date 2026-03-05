import api from "../api/axios";

export const authService = {
  async login(credentials) {
    const { data } = await api.post("/auth/signin", credentials);
    return data;
  },

  async logout() {
    await api.post("/auth/signout");
  },

  async getMyProfile() {
    const { data } = await api.get("/user/me");
    return data?.user ?? null;
  },

  async getStaffOptions() {
    const { data } = await api.get("/user/staff-options");
    return data;
  },

  async getAllUsers(params = {}) {
    const { data } = await api.get("/admin/all-users", { params });
    return data;
  },

  async createUser(payload) {
    const { data } = await api.post("/admin/create-user", payload);
    return data;
  },

  async updateUser(userId, payload) {
    const { data } = await api.put(`/admin/user/${userId}`, payload);
    return data;
  },

  async setUserStatus(userId, isActive) {
    const { data } = await api.patch(`/admin/user/${userId}/status`, {
      is_active: isActive,
    });
    return data;
  },

  async deleteUser(userId) {
    const { data } = await api.delete(`/admin/user/${userId}`);
    return data;
  },
};
