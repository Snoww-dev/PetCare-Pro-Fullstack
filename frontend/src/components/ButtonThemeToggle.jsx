import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../stores/useThemeStore";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-muted)]"
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
      <span>{theme === "light" ? "Tối" : "Sáng"}</span>
    </button>
  );
};

export default ThemeToggle;
