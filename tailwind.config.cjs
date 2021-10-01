const config = {
  mode: "jit",
  purge: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        mono: ["Fira Code", "monospace"]
      },
      colors: {
        primary: {
          DEFAULT: "#25132A",
          light: "#523E57",
          dark: "#0C060E",
          accent: "#563A92"
        },
        secondary: {
          hover: "#429E9B",
          DEFAULT: "#00C9BA"
        }
      }
    }
  },
  plugins: []
};

module.exports = config;
