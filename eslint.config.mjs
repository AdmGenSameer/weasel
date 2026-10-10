import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: ["apps/api/src/generated/**", "apps/web/.next/**"] },
  ...nextVitals,
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
];

export default config;
