import webVitals from 'eslint-config-next/core-web-vitals';
import ts from 'eslint-config-next/typescript';

const config = [
  ...webVitals,
  ...ts,
  { ignores: ['out/**', '.next/**', 'public/sw.js', 'public/engine/**', 'next-env.d.ts'] },
];

export default config;
