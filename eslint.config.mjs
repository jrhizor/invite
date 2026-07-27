// ESLint 9 flat config. Next 16 removed the built-in `next lint` command, so we
// run ESLint directly (`eslint .`) and consume Next's shareable config, which is
// now published as a flat-config array (includes the @typescript-eslint parser).
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
];

export default config;
