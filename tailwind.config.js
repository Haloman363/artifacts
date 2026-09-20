export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dog Vision palette: the UI sticks to yellow and blue, the two hues a dog can tell apart.
        dv: {
          ink: "#0c0d10",
          panel: "#15171c",
          line: "#272b34",
          text: "#ece8df",
          mute: "#8a8d98",
          yellow: "#e9c84a",
          blue: "#7382ff",
        },
      },
    },
  },
  plugins: [],
};
