import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
      adminUsers: [],

      setAuth: ({ token, user = null }) =>
        set({
          token,
          user,
          role: user?.role ?? null,
          isAuthenticated: Boolean(token),
        }),

      setUser: (user) =>
        set({
          user,
          role: user?.role ?? null,
        }),

      setAdminUsers: (users) =>
        set({
          adminUsers: Array.isArray(users) ? users : [],
        }),

      addAdminUser: (newUser) =>
        set((state) => ({
          adminUsers: [newUser, ...state.adminUsers],
        })),

      updateAdminUser: (userId, updates) =>
        set((state) => ({
          adminUsers: state.adminUsers.map((user) =>
            user._id === userId || user.id === userId
              ? { ...user, ...updates }
              : user
          ),
        })),

      removeAdminUser: (userId) =>
        set((state) => ({
          adminUsers: state.adminUsers.filter(
            (user) => user._id !== userId && user.id !== userId
          ),
        })),

      isAdmin: () => {
        const { role } = useAuthStore.getState();
        return role === "admin";
      },

      isStaff: () => {
        const { role } = useAuthStore.getState();
        return role === "staff";
      },

      canManageUsers: () => {
        const { role } = useAuthStore.getState();
        return role === "admin";
      },

      clearAuth: () =>
        set({
          user: null,
          role: null,
          token: null,
          isAuthenticated: false,
          adminUsers: [],
        }),
    }),
    { name: "auth-storage" }
  )
);
