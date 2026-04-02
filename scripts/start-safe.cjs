#!/usr/bin/env node
/**
 * Script para iniciar Backend e Frontend de forma segura
 * com logging completo
 */

const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const BACKEND_DIR = path.join(ROOT, "backend");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const LOG_FILE = path.join(BACKEND_DIR, "startup.log");

console.log("\n╔═══════════════════════════════════════════════╗");
console.log("║   NEXUS CHATBOT - Inicialização Completa      ║");
console.log("╚═══════════════════════════════════════════════╝\n");

// Limpar log anterior
if (fs.existsSync(LOG_FILE)) {
  fs.unlinkSync(LOG_FILE);
}

const writeLog = (msg) => {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + "\n");
};

// ========== FASE 1: Limpar porta 3000 ==========
writeLog("[1/4] Limpando porta 3000...");
const cleanup = spawn("Get-NetTCPConnection", [
  "-LocalPort", "3000", 
  "-ErrorAction", "SilentlyContinue",
  "|", "Select-Object", "-ExpandProperty", "OwningProcess",
  "|", "ForEach-Object", "{", "Stop-Process", "-Id", "$_", "-Force", "-ErrorAction", "SilentlyContinue", "}"
], {
  shell: true,
  stdio: "pipe"
});

cleanup.on("close", (code) => {
  setTimeout(() => {
    startBackend();
  }, 1000);
});

// ========== FASE 2: Iniciar Backend ==========
const startBackend = () => {
  writeLog("[2/4] Iniciando Backend em background...\n");
  
  const backend = spawn("npm", ["run", "dev"], {
    cwd: BACKEND_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  let backendOutput = "";
  let backendReady = false;

  backend.stdout.on("data", (data) => {
    const chunk = data.toString();
    backendOutput += chunk;
    writeLog("[BACKEND] " + chunk.trim());
    
    if (chunk.includes("Servidor rodando")) {
      backendReady = true;
    }
  });

  backend.stderr.on("data", (data) => {
    const chunk = data.toString();
    writeLog("[BACKEND ERROR] " + chunk.trim());
  });

  // ========== FASE 3: Aguardar Backend ==========
  writeLog("[3/4] Aguardando Backend responder (até 30 segundos)...");
  
  let healthCheckAttempts = 0;
  const maxAttempts = 30;
  
  const healthCheck = setInterval(() => {
    healthCheckAttempts++;
    
    http.get("http://localhost:3000/api/health", (res) => {
      if (res.statusCode === 200) {
        clearInterval(healthCheck);
        writeLog("\n✅ Backend respondendo com êxito!\n");
        startFrontend();
      }
    }).on("error", () => {
      if (healthCheckAttempts % 5 === 0) {
        writeLog(`     Tentativa ${healthCheckAttempts}/${maxAttempts}...`);
      }
      
      if (healthCheckAttempts >= maxAttempts) {
        clearInterval(healthCheck);
        writeLog("\n❌ ERRO: Backend não respondeu após 30 tentativas!");
        writeLog("\n📋 LOG COMPLETO DO BACKEND:");
        writeLog("─".repeat(50));
        writeLog(backendOutput);
        writeLog("─".repeat(50));
        writeLog("\n💡 Solução:");
        writeLog("1. Verifique a janela do Backend (pode estar congelada)");
        writeLog("2. Rode manualmente: cd backend && npm run dev");
        writeLog("3. Procure por erros de Prisma ou dependências");
        writeLog("\n");
        process.exit(1);
      }
    });
  }, 1000);
};

// ========== FASE 4: Iniciar Frontend ==========
const startFrontend = () => {
  writeLog("[4/4] Iniciando Frontend...\n");
  
  const frontend = spawn("npm", ["run", "dev"], {
    cwd: FRONTEND_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  frontend.stdout.on("data", (data) => {
    writeLog("[FRONTEND] " + data.toString().trim());
  });

  frontend.stderr.on("data", (data) => {
    writeLog("[FRONTEND] " + data.toString().trim());
  });

  writeLog("\n╔═══════════════════════════════════════════════╗");
  writeLog("║      ✅ SERVIDORES INICIADOS COM ÊXITO!      ║");
  writeLog("╚═══════════════════════════════════════════════╝\n");
  writeLog("🌐 Frontend (Painel)    : http://localhost:5173");
  writeLog("🔗 Backend (API)        : http://localhost:3000");
  writeLog("💚 Health Check         : http://localhost:3000/api/health");
  writeLog("\n📋 Logs salvos em: " + LOG_FILE + "\n");
};
