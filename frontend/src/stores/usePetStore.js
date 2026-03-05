import { create } from "zustand";

export const usePetStore = create((set) => ({
  pets: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },

  setPets: (pets) =>
    set({
      pets: Array.isArray(pets) ? pets : [],
    }),

  setPagination: (pagination) =>
    set({
      pagination: {
        total: pagination?.total ?? 0,
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 10,
        totalPages: pagination?.totalPages ?? 1,
        hasNext: pagination?.hasNext ?? false,
        hasPrev: pagination?.hasPrev ?? false,
      },
    }),

  upsertPet: (pet) =>
    set((state) => {
      const petId = pet?._id || pet?.id;
      if (!petId) return state;

      const exists = state.pets.some((item) => (item?._id || item?.id) === petId);

      if (!exists) {
        return { pets: [pet, ...state.pets] };
      }

      return {
        pets: state.pets.map((item) =>
          (item?._id || item?.id) === petId ? { ...item, ...pet } : item
        ),
      };
    }),

  removePet: (petId) =>
    set((state) => ({
      pets: state.pets.filter((item) => (item?._id || item?.id) !== petId),
    })),

  clearPets: () =>
    set({
      pets: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    }),
}));
