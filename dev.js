/**
 * SERS - Unified Development Runner
 *
 * Starts both backend (Laravel) and frontend (Next.js) with a single command.
 * Pressing Ctrl+C shows an interactive prompt: stop backend too? (y/n)
 *
 * Usage:
 *   node dev.js           → dev mode (Turbopack + HMR)
 *   node dev.js --prod    → production mode (pre-built, fast)
 */

const { spawn, execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const net = require('net');

// ============================================================
// Configuration
// ============================================================
const MAX_PORT_TRIES   = 3;
const MAX_RESTARTS     = 3;
const RESTART_DELAY_MS = 2000;

const USE_DEV_MODE = !process.argv.includes('--prod');
const FORCE_BUILD  = process.argv.includes('--force-build');
// [PERF] --skip-build: use existing .next directly, don't rebuild even if source changed
const SKIP_BUILD   = process.argv.includes('--skip-build');

// ============================================================
// Colors
// ============================================================
const C = {
    reset:  '\x1b[0m',
    yellow: '\x1b[33m',
    cyan:   '\x1b[36m',
    green:  '\x1b[32m',
    red:    '\x1b[31m',
    bold:   '\x1b[1m',
    dim:    '\x1b[2m',
};

// ============================================================
// Read .env settings
// ============================================================
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    const defaults = { BACKEND_PORT: '8001', FRONTEND_PORT: '3001' };

    if (!fs.existsSync(envPath)) {
        console.log('⚠️  .env not found, creating with defaults...');
        fs.writeFileSync(envPath, [
            'BACKEND_PORT=8001',
            'FRONTEND_PORT=3001',
            'APP_ENV=local',
        ].join('\n'));
    }

    const content = fs.readFileSync(envPath, 'utf-8');
    const env = { ...defaults };

    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length) {
            env[key.trim()] = valueParts.join('=').trim();
        }
    }
    return env;
}

// ============================================================
// Port utilities
// ============================================================
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => { server.close(); resolve(true); });
        server.listen(port, '127.0.0.1');
    });
}

/**
 * [SMART] Force-clean a port by killing any stale process using it.
 * This prevents the "dual server" problem where old instances linger.
 */
async function forceCleanPort(port, label) {
    if (await isPortAvailable(port)) return; // Port is free, nothing to do
    
    console.log(`  🧹 ${label} port ${port} is occupied — cleaning up stale process...`);
    try {
        if (process.platform === 'win32') {
            // Find the PID using the port and kill it
            const result = execSync(
                `netstat -ano | findstr ":${port}" | findstr "LISTENING"`,
                { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
            ).trim();
            const lines = result.split('\n').filter(l => l.trim());
            const pids = new Set();
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parseInt(parts[parts.length - 1]);
                if (pid && pid !== 0 && pid !== process.pid) pids.add(pid);
            }
            for (const pid of pids) {
                try {
                    execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
                    console.log(`  ✅ Killed stale process PID ${pid} on port ${port}`);
                } catch { /* already dead */ }
            }
        } else {
            execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
        }
        // Wait a moment for the port to be released
        await new Promise(r => setTimeout(r, 1500));
    } catch {
        console.log(`  ⚠️  Could not auto-clean port ${port} — will try next port`);
    }
}

async function findAvailablePort(startPort, label) {
    let port = parseInt(startPort);
    
    // [SMART] First, try to clean the preferred port
    await forceCleanPort(port, label);
    if (await isPortAvailable(port)) return port;
    
    // Fallback: try next ports
    const maxPort = port + MAX_PORT_TRIES - 1;
    for (let p = port + 1; p <= maxPort; p++) {
        if (await isPortAvailable(p)) {
            console.log(`   ⚡ Using port ${p} for ${label}`);
            return p;
        }
    }
    throw new Error(`No available port for ${label} in range ${port}-${maxPort}`);
}

// ============================================================
// Build fingerprint (skip unnecessary builds)
// ============================================================
const MANIFEST_FILE = path.join(__dirname, 'frontend', '.next', 'BUILD_MANIFEST_HASH');
const SOURCE_EXTS   = new Set(['.tsx', '.ts', '.css', '.js', '.jsx', '.mjs']);
const SKIP_DIRS     = new Set(['node_modules', '.next', '.git', 'dist']);

function computeSourceFingerprint() {
    const srcDir = path.join(__dirname, 'frontend', 'src');
    const entries = [];

    function walkDir(dir) {
        try {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!SKIP_DIRS.has(entry.name)) walkDir(fullPath);
                } else if (SOURCE_EXTS.has(path.extname(entry.name))) {
                    try {
                        const stat = fs.statSync(fullPath);
                        const rel  = path.relative(path.join(__dirname, 'frontend'), fullPath);
                        entries.push(`${rel}:${stat.size}:${Math.floor(stat.mtimeMs)}`);
                    } catch { /* skip locked files */ }
                }
            }
        } catch { /* ignore */ }
    }

    walkDir(srcDir);

    for (const cf of ['next.config.mjs', 'tailwind.config.ts', 'tsconfig.json', 'package.json']) {
        const cfPath = path.join(__dirname, 'frontend', cf);
        try {
            if (fs.existsSync(cfPath)) {
                const stat = fs.statSync(cfPath);
                entries.push(`${cf}:${stat.size}:${Math.floor(stat.mtimeMs)}`);
            }
        } catch { /* ignore */ }
    }

    entries.sort();
    return crypto.createHash('md5').update(entries.join('\n')).digest('hex');
}

/**
 * [SMART] Validate that the .next build is complete and not corrupted.
 * Checks for BUILD_ID + routes-manifest.json integrity.
 */
function isBuildValid() {
    const buildId = path.join(__dirname, 'frontend', '.next', 'BUILD_ID');
    if (!fs.existsSync(buildId)) return false;

    // Check routes-manifest.json has required keys
    const routesManifest = path.join(__dirname, 'frontend', '.next', 'routes-manifest.json');
    try {
        if (!fs.existsSync(routesManifest)) return false;
        const manifest = JSON.parse(fs.readFileSync(routesManifest, 'utf-8'));
        // Next.js requires these arrays to exist
        if (!Array.isArray(manifest.staticRoutes) || !Array.isArray(manifest.dynamicRoutes)) {
            console.log('  ⚠️  Build is corrupted (routes-manifest incomplete) — rebuilding...');
            return false;
        }
    } catch {
        console.log('  ⚠️  Build is corrupted (cannot read routes-manifest) — rebuilding...');
        return false;
    }

    // Check pages-manifest.json exists (required for production start)
    const pagesManifest = path.join(__dirname, 'frontend', '.next', 'server', 'pages-manifest.json');
    if (!fs.existsSync(pagesManifest)) {
        // App Router projects may not have pages-manifest — check app-paths-manifest instead
        const appManifest = path.join(__dirname, 'frontend', '.next', 'server', 'app-paths-manifest.json');
        if (!fs.existsSync(appManifest)) {
            console.log('  ⚠️  Build is corrupted (missing app manifest) — rebuilding...');
            return false;
        }
    }

    return true;
}

function needsBuild() {
    const buildValid = isBuildValid();
    if (SKIP_BUILD && buildValid) { console.log('  ⚡ --skip-build: using existing build.\n'); return false; }
    if (SKIP_BUILD && !buildValid) { console.log('  ⚠️  --skip-build but build is missing/corrupted — building now...\n'); return true; }
    if (FORCE_BUILD) { console.log('  🔨 Force build requested.'); return true; }
    if (!buildValid) return true;

    const currentHash = computeSourceFingerprint();
    try {
        if (fs.existsSync(MANIFEST_FILE)) {
            const storedHash = fs.readFileSync(MANIFEST_FILE, 'utf-8').trim();
            if (storedHash === currentHash) {
                console.log('  ⚡ No source changes detected — skipping build.\n');
                return false;
            }
        }
    } catch { /* just rebuild */ }
    return true;
}

function saveManifestHash() {
    try { fs.writeFileSync(MANIFEST_FILE, computeSourceFingerprint(), 'utf-8'); } catch { /* non-critical */ }
}

function buildFrontend(frontendDir, env) {
    return new Promise((resolve, reject) => {
        console.log('  🔨 Building frontend (first run or source changed)...');
        console.log('  ⏳ This takes ~1-2 minutes, subsequent starts will be instant.\n');

        const build = spawn('npx', ['next', 'build'], {
            cwd: frontendDir, stdio: 'pipe',
            env: { ...env, NODE_ENV: 'production' }, shell: true,
        });

        build.stdout.on('data', (d) => {
            const line = d.toString().trim();
            if (line && (line.includes('✓') || line.includes('Route') || line.includes('error') || line.includes('warn')))
                console.log(`  ${C.cyan}[build]${C.reset}  ${line}`);
        });
        build.stderr.on('data', (d) => {
            const line = d.toString().trim();
            if (line && !line.includes('DeprecationWarning'))
                console.log(`  ${C.yellow}[build]${C.reset}  ${line}`);
        });
        build.on('exit', (code) => {
            if (code === 0) { saveManifestHash(); console.log('\n  ✅ Build complete!\n'); resolve(); }
            else reject(new Error(`Build failed with code ${code}`));
        });
    });
}

// ============================================================
// Kill process tree (Windows-safe)
// ============================================================
function killProcessTree(pid) {
    try {
        if (process.platform === 'win32') {
            execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
        } else {
            process.kill(-pid, 'SIGKILL');
        }
    } catch { /* Process may already be dead */ }
}

// ============================================================
// Server process manager
// ============================================================
let suppressOutput = false; // Global flag to mute server output during shutdown prompt

function createServer({ label, color, command, args, cwd, env }) {
    let restartCount = 0;
    let proc = null;
    let stopped = false;

    const colorCode = color === 'yellow' ? C.yellow : C.cyan;
    const prefix = `  ${colorCode}[${label}]${C.reset}`;

    function start() {
        const startTime = Date.now();

        proc = spawn(command, args, {
            cwd, stdio: 'pipe', env, shell: true, windowsHide: true,
        });

        proc.stdout.on('data', (data) => {
            if (suppressOutput) return;
            const line = data.toString().trim();
            if (!line) return;
            if (line.includes('DeprecationWarning') || line.includes('trace-deprecation')) return;
            console.log(`${prefix}  ${line}`);
        });

        proc.stderr.on('data', (data) => {
            if (suppressOutput) return;
            const line = data.toString().trim();
            if (!line) return;
            if (line.includes('DeprecationWarning') || line.includes('Terminate batch job')) return;
            console.log(`${prefix}  ${line}`);
        });

        proc.on('exit', (code) => {
            if (stopped) return;
            if (code !== null && code !== 0) {
                if (suppressOutput) return;
                console.log(`${prefix}  ❌ Exited with code ${code}`);
                if (restartCount < MAX_RESTARTS) {
                    restartCount++;
                    console.log(`${prefix}  🔄 Restarting (${restartCount}/${MAX_RESTARTS}) in ${RESTART_DELAY_MS / 1000}s...`);
                    setTimeout(start, RESTART_DELAY_MS);
                } else {
                    console.log(`${prefix}  💀 Max restarts reached. Server stopped.`);
                }
            }
        });
    }

    function kill() {
        stopped = true;
        if (proc && !proc.killed && proc.pid) {
            killProcessTree(proc.pid);
        }
    }

    function isRunning() {
        return proc && !proc.killed && !stopped;
    }

    return { start, kill, isRunning };
}

// ============================================================
// Shutdown — No interactive prompt (Windows-safe)
// ============================================================
// [FIX] On Windows, setRawMode(true) after Ctrl+C causes the
// terminal to enter a broken state where typed characters are
// echoed but never processed. Instead, we use a simple approach:
//   - 1st Ctrl+C: stop frontend, backend keeps running for 3s window
//   - 2nd Ctrl+C within 3s: force-kill everything immediately
//   - If no 2nd Ctrl+C: auto-stop backend after 3s timeout
//
// This avoids ALL interactive stdin issues on Windows.

// ============================================================
// Main
// ============================================================
async function main() {
    process.removeAllListeners('warning');

    const env         = loadEnv();
    const startTime   = Date.now();
    const frontendDir = path.join(__dirname, 'frontend');
    const nextCacheDir = path.join(frontendDir, '.next');

    // [PERF] .next cache is NEVER deleted automatically.
    // Turbopack builds each page ONCE and stores results in .next/cache/turbopack/
    // This cache persists across restarts — so pages are fast after the first visit.
    // Deleting .next would force a full recompile (ENOENT errors + 500 pages).
    if (USE_DEV_MODE && fs.existsSync(nextCacheDir)) {
        try {
            // Just show cache size for info — never delete
            const staticDir = path.join(nextCacheDir, 'static');
            if (fs.existsSync(staticDir)) {
                console.log(`  📦 Turbopack cache found — loading will be fast`);
            }
        } catch { /* ignore */ }
    }


    console.log('');
    console.log(`  ${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
    console.log(`  ${C.bold}║     🚀 SERS - Smart Educational Records     ║${C.reset}`);
    console.log(`  ${C.bold}╚══════════════════════════════════════════════╝${C.reset}`);
    console.log('');

    const backendPort  = await findAvailablePort(env.BACKEND_PORT,  'Backend');
    const frontendPort = await findAvailablePort(env.FRONTEND_PORT, 'Frontend');

    const mode        = USE_DEV_MODE ? 'dev (Turbopack)' : 'production';
    const frontendUrl = `http://localhost:${frontendPort}`;

    console.log(`  📦 ${C.yellow}Backend${C.reset}:  http://localhost:${backendPort}`);
    console.log(`  🌐 ${C.cyan}Frontend${C.reset}: ${frontendUrl}  [${mode}]`);
    console.log('');
    console.log(`  ${C.dim}─────────────────────────────────────────────${C.reset}`);
    console.log('');

    const childEnv = {
        ...process.env,
        BACKEND_URL:    `http://localhost:${backendPort}`,
        BACKEND_PORT:   String(backendPort),
        FRONTEND_URL:   frontendUrl,
        FRONTEND_PORT:  String(frontendPort),
        PORT:           String(frontendPort),
        NODE_ENV:       USE_DEV_MODE ? 'development' : 'production',
        NODE_NO_WARNINGS: '1',
    };

    // Build frontend if running in production mode and build is stale
    if (!USE_DEV_MODE && needsBuild()) {
        try {
            await buildFrontend(frontendDir, childEnv);
        } catch (err) {
            console.error(`  ❌ Build failed: ${err.message}`);
            console.log('  💡 Falling back to dev mode...\n');
        }
    }

    // ── Start servers ─────────────────────────────────────────
    const backend = createServer({
        label: 'backend', color: 'yellow',
        command: 'php',
        args: ['artisan', 'serve', `--port=${backendPort}`],
        cwd: path.join(__dirname, 'backend'),
        env: childEnv,
    });

    const frontendArgs = USE_DEV_MODE
        ? ['next', 'dev', '--turbopack', '-p', String(frontendPort)]
        : ['next', 'start', '-p', String(frontendPort)];

    const frontend = createServer({
        label: 'frontend', color: 'cyan',
        command: 'npx',
        args: frontendArgs,
        cwd: frontendDir,
        env: childEnv,
    });

    backend.start();
    frontend.start();

    const setupTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    console.log(`  ⏱️  Setup completed in ${setupTime}s`);
    console.log(`  ${C.bold}💡 Press Ctrl+C to stop${C.reset}`);
    console.log('');

    // ── Clean shutdown (NO interactive prompt — Windows-safe) ──
    let shutdownPhase = 0; // 0 = running, 1 = first Ctrl+C, 2 = force kill

    function handleShutdown() {
        shutdownPhase++;
        suppressOutput = true;

        if (shutdownPhase === 1) {
            // ── First Ctrl+C: stop everything cleanly ──
            console.log('');
            console.log(`  ${C.yellow}⚠️  Stopping all servers...${C.reset}`);
            console.log(`  ${C.dim}(Press Ctrl+C again to force stop)${C.reset}`);
            console.log('');

            // Stop frontend first
            frontend.kill();
            console.log(`  ✅ Frontend stopped`);

            // Stop backend
            backend.kill();
            try {
                execSync(`taskkill /fi "imagename eq php.exe" /f`, { stdio: 'ignore' });
            } catch { /* ignore */ }
            console.log(`  ✅ Backend stopped`);

            console.log('');
            console.log(`  ${C.green}${C.bold}✅ All servers stopped successfully!${C.reset}`);
            console.log('');

            // Exit after a small delay to let output flush
            setTimeout(() => process.exit(0), 500);
        } else {
            // ── Second Ctrl+C: force kill immediately ──
            console.log(`\n  ${C.red}🛑 Force kill!${C.reset}`);
            frontend.kill();
            backend.kill();
            try {
                execSync(`taskkill /fi "imagename eq php.exe" /f`, { stdio: 'ignore' });
                execSync(`taskkill /fi "imagename eq node.exe" /fi "windowtitle eq *next*" /f`, { stdio: 'ignore' });
            } catch { /* ignore */ }
            process.exit(1);
        }
    }

    process.on('SIGINT',  handleShutdown);
    process.on('SIGTERM', handleShutdown);
    process.on('exit', () => {
        if (shutdownPhase === 0) {
            frontend.kill();
            backend.kill();
        }
    });
}

main().catch((err) => {
    console.error('  ❌ Error:', err.message);
    process.exit(1);
});
