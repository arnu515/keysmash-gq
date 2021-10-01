const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const vars = require("postcss-simple-vars");
const imports = require("postcss-import");
const mixins = require("postcss-mixins");
const nested = require("postcss-nested");

const mode = process.env.NODE_ENV;
const dev = mode === "development";

const config = {
  plugins: [
    vars(),
    mixins(),
    nested(),
    imports(),
    tailwindcss(),
    autoprefixer(),
    !dev &&
      cssnano({
        preset: "default"
      })
  ]
};

module.exports = config;
