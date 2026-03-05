import api from "../api/axios";

export const petTypeService = {
  async getPetTypes(params = {}) {
    const { data } = await api.get("/pet-types", { params });
    return data;
  },

  async createPetType(payload) {
    const { data } = await api.post("/pet-types", payload);
    return data;
  },

  async updatePetType(id, payload) {
    const { data } = await api.put(`/pet-types/${id}`, payload);
    return data;
  },

  async deletePetType(id) {
    const { data } = await api.delete(`/pet-types/${id}`);
    return data;
  },
};
