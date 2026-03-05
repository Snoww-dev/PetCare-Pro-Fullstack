import { create } from "zustand";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export const useThemeStore = create((set) => ({
  theme: "light",

  initTheme: () => {
    const savedTheme = localStorage.getItem("theme");

    const theme = savedTheme || getSystemTheme();

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";

      localStorage.setItem("theme", newTheme);

      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      return { theme: newTheme };
    }),
}));