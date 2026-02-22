module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBg: "#B9C7D9",
        brandText: "#334155",
        brandTextStrong: "#334155",
        brandAccent: "#D4829A", 
        brandAccentHover: "#B6667F",
        brandAccentAlt: "#F6EBF0",
        brandAccentAlt2: "#FCE8EE",
        brandTrack: "#FBE9EF",
        brandBubble: "#FEF6F8",
        brandPanel: "#F4F6FA",
        brandInput: "#F4F4F7",
        brandMuted: "#60626B",
        brandMutedAlt: "#6A6A75",
        neutralMuted: "#444444",
        neutralText: "#555555",
        neutralBg: "#DDDDDD",
      },
      borderRadius: {
        card: "20px",
        bubble: "16px",
        button: "12px",
        input: "10px",
      },
    },
  },
  plugins: [],
}
