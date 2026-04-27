export default {
  content: ["./index.html", "./frontend/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        background: "#131313",
        surface: "#1f2020",
        "surface-low": "#1b1c1c",
        "surface-high": "#2a2a2a",
        "surface-highest": "#353535",
        paper: "#FAFAFA",
        muted: "rgba(250,250,250,0.52)",
        line: "rgba(250,250,250,0.2)",
        primary: "#FF3D00",
        "primary-soft": "#ffb4a2",
        danger: "#ffb4ab",
        blue: "#a6c8ff",
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
