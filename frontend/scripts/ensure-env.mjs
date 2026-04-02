const isProdBuild = process.env.NODE_ENV === "production" || process.env.CI === "true";

if (isProdBuild && !process.env.VITE_API_URL) {
  console.error("Erro: VITE_API_URL é obrigatório para build de produção.");
  process.exit(1);
}

console.log("Env check OK.");
