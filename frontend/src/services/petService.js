import api from "../api/axios";

export const petService = {
  async getPets(params = {}) {
    const { data } = await api.get("/pet/get-all-pets", { params });
    return data;
  },

  async getPetById(petId) {
    const { data } = await api.get(`/pet/get-pet/${petId}`);
    return data;
  },

  async getPetFormOptions(params = {}) {
    const { data } = await api.get("/pet/options", { params });
    return data;
  },

  async createPet(payload) {
    const { data } = await api.post("/pet/create-pet", payload);
    return data;
  },

  async updatePet(petId, payload) {
    const { data } = await api.put(`/pet/update-pet/${petId}`, payload);
    return data;
  },

  async deletePet(petId) {
    const { data } = await api.delete(`/pet/delete-pet/${petId}`);
    return data;
  },
};
