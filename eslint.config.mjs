import nextPlugin from "eslint-config-next";

export default [
  ...nextPlugin,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Client-only init from localStorage/matchMedia inside a mount effect is
      // the intended hydration-safe pattern across these tool pages; the strict
      // compiler-era rule flags it, so keep it visible as a warning only.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
