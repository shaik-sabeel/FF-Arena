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
          dark: "#08090c",
          card: "#0f111a",
          border: "#1e2235",
          accent: "#ff5722", // Neon Orange/Red
          orange: "#ff5722",
          yellow: "#ffb300",
          gold: "#ffd700",
          blue: "#00e5ff",
          text: "#a0a5b5",
          light: "#f5f6f8"
        }
      },
      fontFamily: {
        gaming: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        neon: "0 0 12px rgba(255, 87, 34, 0.4)",
        'neon-hover': "0 0 20px rgba(255, 87, 34, 0.7)",
        'neon-gold': "0 0 15px rgba(255, 179, 0, 0.4)",
        'neon-blue': "0 0 15px rgba(0, 229, 255, 0.4)",
        card: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
        glass: "inset 0 1px 1px rgba(255, 255, 255, 0.05)"
      },
      backgroundImage: {
        'gradient-gaming': 'linear-gradient(135deg, #0f111a 0%, #08090c 100%)',
        'gradient-fire': 'linear-gradient(135deg, #ff8a00 0%, #da1b60 100%)',
        'gradient-dark': 'linear-gradient(180deg, #131722 0%, #08090c 100%)',
        'gradient-gold': 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
        'gradient-neon': 'linear-gradient(90deg, #ff5722 0%, #00e5ff 100%)',
      }
    },
  },
  plugins: [],
}
