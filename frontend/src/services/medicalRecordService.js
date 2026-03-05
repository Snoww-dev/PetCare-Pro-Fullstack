import api from "../api/axios";

export const medicalRecordService = {
  async getMedicalRecords(params = {}) {
    const { data } = await api.get("/medical-records", { params });
    return data;
  },

  async createMedicalRecord(payload) {
    const { data } = await api.post("/medical-records", payload);
    return data;
  },

  async updateMedicalRecord(recordId, payload) {
    const { data } = await api.put(`/medical-records/${recordId}`, payload);
    return data;
  },

  async deleteMedicalRecord(recordId) {
    const { data } = await api.delete(`/medical-records/${recordId}`);
    return data;
  },
};
