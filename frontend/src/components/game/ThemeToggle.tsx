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
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        width: "72px",
        height: "36px",
        borderRadius: "999px",
        padding: "4px",
        cursor: "pointer",
        border: "1px solid hsl(var(--border))",
        background: isDark
          ? "hsl(var(--card))"
          : "hsl(var(--secondary))",
        boxShadow: isDark
          ? "0 2px 12px hsl(0 0% 0% / 0.4), inset 0 1px 2px hsl(0 0% 0% / 0.3)"
          : "0 2px 12px hsl(var(--primary) / 0.15), inset 0 1px 2px hsl(0 0% 0% / 0.06)",
        transition: "background 0.35s, border-color 0.35s, box-shadow 0.35s",
        outline: "none",
      }}
    >
      {/* Sun icon — left side */}
      <span
        style={{
          position: "absolute",
          left: "11px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isDark
            ? "hsl(var(--muted-foreground))"
            : "hsl(var(--primary-foreground))",
          transition: "color 0.35s, opacity 0.35s",
          opacity: isDark ? 0.45 : 1,
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <Sun size={14} strokeWidth={2} />
      </span>

      {/* Moon icon — right side */}
      <span
        style={{
          position: "absolute",
          right: "11px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isDark
            ? "hsl(var(--primary-foreground))"
            : "hsl(var(--muted-foreground))",
          transition: "color 0.35s, opacity 0.35s",
          opacity: isDark ? 1 : 0.45,
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <Moon size={14} strokeWidth={2} />
      </span>

      {/* Sliding knob */}
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: isDark ? "calc(100% - 31px)" : "3px",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "hsl(var(--primary))",
          boxShadow: isDark
            ? "0 2px 8px hsl(var(--primary) / 0.45)"
            : "0 2px 8px hsl(var(--primary) / 0.45)",
          transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.35s, box-shadow 0.35s",
          zIndex: 2,
        }}
      />
    </button>
  );
};

export default ThemeToggle;
