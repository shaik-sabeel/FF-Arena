/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gaming: {
          dark: "#000000",
          card: "#08090c",
          border: "#111520",
          accent: "#35D5FA", /* Neon Blue */
          orange: "#35D5FA",
          yellow: "#00e5ff",
          gold: "#35D5FA",
          blue: "#35D5FA",
          text: "#a0a5b5",
          light: "#f5f6f8"
        }
      },
      fontFamily: {
        gaming: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        neon: "0 0 12px rgba(53, 213, 250, 0.4)",
        'neon-hover': "0 0 20px rgba(53, 213, 250, 0.7)",
        'neon-gold': "0 0 15px rgba(53, 213, 250, 0.4)",
        'neon-blue': "0 0 15px rgba(53, 213, 250, 0.4)",
        card: "0 8px 32px 0 rgba(0, 0, 0, 0.8)",
        glass: "inset 0 1px 1px rgba(53, 213, 250, 0.05)"
      },
      backgroundImage: {
        'gradient-gaming': 'linear-gradient(135deg, #08090c 0%, #000000 100%)',
        'gradient-fire': 'linear-gradient(135deg, #35D5FA 0%, #0056b3 100%)',
        'gradient-dark': 'linear-gradient(180deg, #08090c 0%, #000000 100%)',
        'gradient-gold': 'linear-gradient(135deg, #35D5FA 0%, #007bff 100%)',
        'gradient-neon': 'linear-gradient(90deg, #35D5FA 0%, #00e5ff 100%)',
      }
    },
  },
  plugins: [],
}
