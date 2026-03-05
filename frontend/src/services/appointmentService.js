import api from "../api/axios";

export const appointmentService = {
  async getAppointments(params = {}) {
    const { data } = await api.get("/appointments", { params });
    return data;
  },

  async getAppointmentsByDate(date) {
    const { data } = await api.get("/appointments/by-date", { params: { date } });
    return data;
  },

  async createAppointment(payload) {
    const { data } = await api.post("/appointments", payload);
    return data;
  },

  async updateAppointmentStatus(appointmentId, status) {
    const { data } = await api.patch(`/appointments/${appointmentId}/status`, { status });
    return data;
  },
};
