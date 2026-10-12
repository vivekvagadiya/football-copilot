import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["logs/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      "no-undef": "error", // <-- Catches 'selectedMode' is not defined
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
