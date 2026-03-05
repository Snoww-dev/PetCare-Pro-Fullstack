import api from "../api/axios";

export const vaccinationService = {
  async getVaccinationsByPet(petId) {
    const { data } = await api.get(`/vaccinations/pet/${petId}`);
    return data;
  },

  async createVaccination(payload) {
    const { data } = await api.post("/vaccinations", payload);
    return data;
  },
};
