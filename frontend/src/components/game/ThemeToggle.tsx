import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
}

const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => {
  const isDark = theme === "dark";

  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        fixed top-5 right-5 z-50
        w-10 h-10 rounded-full
        flex items-center justify-center
        border border-border/60
        bg-card/80 backdrop-blur-md
        text-muted-foreground hover:text-foreground
        hover:border-primary/40 hover:bg-card
        shadow-md hover:shadow-lg hover:shadow-primary/10
        transition-all duration-300
        group
      "
      style={{ transition: "background-color 0.35s, border-color 0.35s, box-shadow 0.35s, color 0.35s" }}
    >
      {/* Sun icon (shown in dark mode — click to go light) */}
      <Sun
        className="w-4 h-4 absolute"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
          transition: "opacity 0.3s, transform 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      {/* Moon icon (shown in light mode — click to go dark) */}
      <Moon
        className="w-4 h-4 absolute"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)",
          transition: "opacity 0.3s, transform 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </button>
  );
};

export default ThemeToggle;
