import tsParser from "@typescript-eslint/parser";

const eslintConfig = [
  {
    ignores: ["dist/**"],
  },
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["next", "next/*"],
        },
      ],
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];

export default eslintConfig;