import api from "../api/axios";

export const petOwnerService = {
  async getPetOwners(params = {}) {
    const { data } = await api.get("/pet-owners", { params });
    return data;
  },

  async createPetOwner(payload) {
    const { data } = await api.post("/pet-owners", payload);
    return data;
  },

  async updatePetOwner(ownerId, payload) {
    const { data } = await api.put(`/pet-owners/${ownerId}`, payload);
    return data;
  },

  async deletePetOwner(ownerId) {
    const { data } = await api.delete(`/pet-owners/${ownerId}`);
    return data;
  },
};
