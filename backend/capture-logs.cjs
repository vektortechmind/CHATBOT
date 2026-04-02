#!/usr/bin/env node
/**
 * Script para capturar saída completa do backend
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const backendDir = __dirname;
const logFile = path.join(backendDir, "startup-logs.txt");

// Limpar log anterior
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
};

log("╔════════════════════════════════════════╗");
log("║  CAPTURA COMPLETA - Backend Startup    ║");
log("╚════════════════════════════════════════╝\n");

// Matar processo anterior
log("[1] Matando processo anterior na porta 3000...");
const killCmd = spawn("Get-NetTCPConnection", 
  ["-LocalPort", "3000", "-ErrorAction", "SilentlyContinue"],
  { shell: true, stdio: "pipe" }
);

killCmd.on("close", () => {
  log("[2] Iniciando backend com npm run dev...\n");
  
  const npm = spawn("npm", ["run", "dev"], {
    cwd: backendDir,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  let completedOutput = "";

  npm.stdout.on("data", (data) => {
    const text = data.toString();
    completedOutput += text;
    process.stdout.write(text);
    log(text);
  });

  npm.stderr.on("data", (data) => {
    const text = data.toString();
    completedOutput += text;
    process.stderr.write(text);
    log(text);
  });

  npm.on("error", (err) => {
    log("\n❌ Erro ao iniciar npm:");
    log(err.message);
  });

  npm.on("exit", (code) => {
    log(`\n[EXIT] Processo finalizou com código: ${code}`);
  });

  // Timeout de 15 segundos
  setTimeout(() => {
    log("\n\n╔════════════════════════════════════════╗");
    log("║  CAPTURA COMPLETA SALVA EM:            ║");
    log("║  " + logFile);
    log("╚════════════════════════════════════════╝\n");
    
    if (completedOutput.length === 0) {
      log("❌ AVISO: Nenhuma saída foi capturada!");
      log("    O processo pode estar travado ou há erro antes do console.log");
    } else {
      log("✅ Saída capturada com sucesso");
    }

    process.exit(0);
  }, 15000);
});
