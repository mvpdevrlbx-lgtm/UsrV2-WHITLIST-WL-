import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Si tu déploies sur GitHub Pages à l'adresse
// https://TON-PSEUDO.github.io/NOM-DU-REPO/
// remplace "/" ci-dessous par "/NOM-DU-REPO/"
// Si tu déploies sur Vercel/Netlify, laisse "/".
export default defineConfig({
  base: "/",
  plugins: [react()],
});
