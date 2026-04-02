import * as fs from "fs";
import * as path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Extract } from "unzipper";
import { prisma } from "../database/prisma";
import {
  getLatestRelease,
  getReleaseByTag,
  parseVersion,
  hasUpdate,
} from "./github.service";
import { encryptToken, decryptToken, maskToken } from "./crypto.service";

const UPDATE_DIR = process.env.UPDATE_DIR || "./updates";
const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";
const EXCLUDE_PATTERNS = [
  ".env",
  "*.db",
  "*.db-journal",
  "node_modules",
  "backups",
  "updates",
  ".git",
  "*.log",
  ".encryption_key",
];

const CURRENT_VERSION = process.env.APP_VERSION || "v0.0.0";
const GITHUB_REPO = process.env.GITHUB_REPO || "owner/repo";

function getRepoParts(): { owner: string; repo: string } {
  const [owner, repo] = GITHUB_REPO.split("/");
  if (!owner || !repo) {
    throw new Error(`GITHUB_REPO mal formatado: ${GITHUB_REPO}`);
  }
  return { owner, repo };
}

export type UpdateInfo = {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
  changelog: string;
};

export async function checkForUpdate(): Promise<UpdateInfo> {
  const settings = await prisma.settings.findUnique({
    where: { id: "github_update_settings" },
  });

  const token = settings?.githubToken
    ? decryptToken(settings.githubToken)
    : undefined;

  const { owner, repo } = getRepoParts();
  const release = await getLatestRelease(owner, repo, token);

  const latestVersion = parseVersion(release.tag_name);
  const currentVersion = parseVersion(CURRENT_VERSION);

  return {
    currentVersion,
    latestVersion,
    hasUpdate: hasUpdate(currentVersion, latestVersion),
    releaseUrl: release.html_url,
    changelog: release.body || "Sem changelog disponível.",
  };
}

export async function validateGitHubToken(
  token: string
): Promise<{ valid: boolean; message: string }> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (response.ok) {
      return { valid: true, message: "Token válido" };
    }

    if (response.status === 401) {
      return { valid: false, message: "Token inválido ou expirado" };
    }

    if (response.status === 403) {
      return { valid: false, message: "Token sem permissão (verifique scopes)" };
    }

    return {
      valid: false,
      message: `Erro na verificação: ${response.status}`,
    };
  } catch {
    return { valid: false, message: "Erro ao verificar token" };
  }
}

export async function saveGitHubToken(
  token: string
): Promise<{ success: boolean; tokenMasked: string; message?: string }> {
  const validation = await validateGitHubToken(token);
  if (!validation.valid) {
    return { success: false, tokenMasked: maskToken(token), message: validation.message };
  }

  const encrypted = encryptToken(token);
  await prisma.settings.upsert({
    where: { id: "github_update_settings" },
    update: { githubToken: encrypted },
    create: { id: "github_update_settings", githubToken: encrypted },
  });
  return { success: true, tokenMasked: maskToken(token) };
}

export async function removeGitHubToken(): Promise<void> {
  await prisma.settings.upsert({
    where: { id: "github_update_settings" },
    update: { githubToken: null },
    create: { id: "github_update_settings", githubToken: null },
  });
}

export async function getTokenStatus(): Promise<{
  configured: boolean;
  masked: string | null;
}> {
  const settings = await prisma.settings.findUnique({
    where: { id: "github_update_settings" },
  });
  if (!settings?.githubToken) {
    return { configured: false, masked: null };
  }
  const decrypted = decryptToken(settings.githubToken);
  return { configured: true, masked: maskToken(decrypted) };
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function shouldExclude(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return EXCLUDE_PATTERNS.some((pattern) => {
    if (pattern.startsWith("*")) {
      const ext = pattern.slice(1);
      return normalized.endsWith(ext);
    }
    return normalized.includes(pattern);
  });
}

export async function applyUpdate(version: string): Promise<{
  success: boolean;
  newVersion: string;
  message: string;
}> {
  const settings = await prisma.settings.findUnique({
    where: { id: "github_update_settings" },
  });

  const token = settings?.githubToken
    ? decryptToken(settings.githubToken)
    : undefined;

  const { owner, repo } = getRepoParts();

  ensureDir(UPDATE_DIR);
  ensureDir(BACKUP_DIR);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  const rootDir = path.resolve(".");

  await backupCurrent(rootDir, backupPath);

  try {
    const zipPath = await downloadZipball(owner, repo, version, token);
    await extractZip(zipPath, rootDir);
    await cleanupDownload(zipPath);

    await cleanupOldBackups();

    return {
      success: true,
      newVersion: parseVersion(version),
      message:
        "Update aplicado com sucesso. Por favor, reinicie o servidor.",
    };
  } catch (error) {
    await restoreBackup(backupPath, rootDir);
    throw error;
  }
}

async function cleanupOldBackups(): Promise<void> {
  const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });
  const backups = entries
    .filter((e) => e.isDirectory() && e.name.startsWith("backup-"))
    .map((e) => ({
      name: e.name,
      time: fs.statSync(path.join(BACKUP_DIR, e.name)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  const toDelete = backups.slice(2);
  for (const backup of toDelete) {
    fs.rmSync(path.join(BACKUP_DIR, backup.name), { recursive: true });
  }
}

async function backupCurrent(source: string, dest: string): Promise<void> {
  ensureDir(dest);
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldExclude(entry.name)) continue;

    const srcPath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await backupCurrent(srcPath, destPath);
    } else {
      const destDir = path.dirname(destPath);
      ensureDir(destDir);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function downloadZipball(
  owner: string,
  repo: string,
  tag: string,
  token?: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${tag}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Falha ao baixar: ${response.status}`);
  }

  const destPath = path.join(UPDATE_DIR, `${repo}-${tag}.zip`);
  const fileStream = createWriteStream(destPath);

  if (!response.body) {
    throw new Error("Resposta sem body");
  }

  await pipeline(response.body, fileStream);
  return destPath;
}

async function extractZip(zipPath: string, targetDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(Extract({ path: targetDir }))
      .on("close", () => {
        const extractedRoot = findExtractedRoot(targetDir);
        if (extractedRoot) {
          moveContents(extractedRoot, targetDir);
          fs.rmSync(extractedRoot, { recursive: true });
        }
        resolve();
      })
      .on("error", reject);
  });
}

function findExtractedRoot(targetDir: string): string | null {
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const repoDirs = entries.filter(
    (e) =>
      e.isDirectory() &&
      e.name.includes("-") &&
      (e.name.endsWith("-zipball") || /-\w+-\w+$/.test(e.name))
  );

  if (repoDirs.length === 1) {
    return path.join(targetDir, repoDirs[0].name);
  }
  return null;
}

function moveContents(source: string, dest: string): void {
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);

    if (shouldExclude(entry.name)) continue;

    if (entry.isDirectory()) {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true });
      }
      fs.renameSync(srcPath, destPath);
    } else {
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      fs.renameSync(srcPath, destPath);
    }
  }
}

async function cleanupDownload(zipPath: string): Promise<void> {
  try {
    fs.unlinkSync(zipPath);
  } catch {
    // ignore
  }
}

async function restoreBackup(backupPath: string, targetDir: string): Promise<void> {
  if (!fs.existsSync(backupPath)) return;

  const entries = fs.readdirSync(backupPath, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(backupPath, entry.name);
    const destPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await restoreBackup(srcPath, destPath);
    } else {
      const destDir = path.dirname(destPath);
      ensureDir(destDir);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export { getRepoParts, CURRENT_VERSION, GITHUB_REPO };
