export default {
  content: ["./index.html", "./frontend/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        background: "#000000",
        card: "#0A0A0A",
        surface: "#1A1A1A",
        "surface-low": "#1A1A1A",
        "surface-high": "#2A2A2A",
        "surface-highest": "#444444",
        paper: "#FFE8DB",
        muted: "#9A9A9A",
        line: "#2A2A2A",
        primary: "#5682B1",
        secondary: "#739EC9",
        "primary-soft": "#739EC9",
        danger: "#ffb4ab",
        blue: "#739EC9",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter Tight", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"],
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
};
