import api from "../api/axios";

export const breedService = {
  async getBreeds(params = {}) {
    const { data } = await api.get("/breeds", { params });
    return data;
  },

  async createBreed(payload) {
    const { data } = await api.post("/breeds", payload);
    return data;
  },

  async updateBreed(id, payload) {
    const { data } = await api.put(`/breeds/${id}`, payload);
    return data;
  },

  async deleteBreed(id) {
    const { data } = await api.delete(`/breeds/${id}`);
    return data;
  },
};
