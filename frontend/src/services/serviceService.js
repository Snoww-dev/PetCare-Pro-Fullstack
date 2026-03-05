import api from "../api/axios";

export const serviceService = {
  async getServices(params = {}) {
    const { data } = await api.get("/services", { params });
    return data;
  },

  async createService(payload) {
    const { data } = await api.post("/services", payload);
    return data;
  },

  async updateService(serviceId, payload) {
    const { data } = await api.put(`/services/${serviceId}`, payload);
    return data;
  },

  async toggleServiceStatus(serviceId) {
    const { data } = await api.patch(`/services/${serviceId}/toggle-status`);
    return data;
  },

  async deleteService(serviceId) {
    const { data } = await api.delete(`/services/${serviceId}`);
    return data;
  },
};
