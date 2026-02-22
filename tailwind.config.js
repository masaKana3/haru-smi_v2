module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBg: "#B9C7D9",
        brandText: "#475569",
        brandTextStrong: "#475569",
        brandAccent: "#B59DC6",
        brandAccentAlt: "#CDC3D6",
        brandAccentAlt2: "#DAD1DF",
        brandTrack: "#E0DCEC",
        brandBubble: "#F4F0FA",
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
