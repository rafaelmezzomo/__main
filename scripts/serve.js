#!/usr/bin/env node
// serve.js — serve o viewer e sincroniza status do board com o planning.json
// Uso: node scripts/serve.js  → abre http://localhost:4321

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PORT = process.env.PORT || 4321;
const ROOT = path.dirname(__dirname);
const LAYOUT_DIR = path.join(ROOT, '__planning-layout');
const BLOG_DIR = path.join(ROOT, 'blog');
const EFFORT_DIR = path.join(ROOT, 'effort');
const VALID_STATUS = new Set(['todo', 'doing', 'done']);
// arquivos de dados do blog graváveis: <slug>/<arquivo>.json (sem subpastas extras nem "..")
const BLOG_DATA_RE = /^[a-z0-9-]+\/[a-z0-9._-]+\.json$/i;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const WEEK_RE = /^\d{4}-W\d{2}$/;

function planningPath(week) {
  return path.join(ROOT, 'plannings', week, 'planning.json');
}

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

// Debounce do generate.sh por semana
const genTimers = {};
function scheduleGenerate(week) {
  clearTimeout(genTimers[week]);
  genTimers[week] = setTimeout(() => {
    execFile(path.join(ROOT, 'scripts', 'generate.sh'), [week], { cwd: ROOT }, (err) => {
      if (err) console.warn(`generate.sh ${week} falhou (ignorado):`, err.message);
    });
  }, 400);
}

// Debounce do sync-layout.py por semana — re-estampa a const WEEKS do viewer.
// Sem isso a tarefa nova existe no planning.json mas some do board no reload.
const syncTimers = {};
function scheduleSyncLayout(week) {
  clearTimeout(syncTimers[week]);
  syncTimers[week] = setTimeout(() => {
    execFile('python3', [path.join(ROOT, 'scripts', 'sync-layout.py'), week], { cwd: ROOT }, (err) => {
      if (err) console.warn(`sync-layout.py ${week} falhou (ignorado):`, err.message);
    });
  }, 400);
}

// Maior número já usado por um prefixo (mc, yp, sl, mba) em TODAS as semanas.
// A retro do W33 registrou colisão de ID entre semanas quebrando o carryover — por
// isso o id é gerado no servidor, varrendo o histórico inteiro, e não no cliente.
function nextTaskId(prefix) {
  const dir = path.join(ROOT, 'plannings');
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  for (const week of fs.readdirSync(dir)) {
    const file = path.join(dir, week, 'planning.json');
    let json;
    try { json = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    for (const proj of Object.values(json.projects || {})) {
      for (const task of proj.tasks || []) {
        const m = re.exec(task.id || '');
        if (m) max = Math.max(max, parseInt(m[1], 10));
      }
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

const ID_PREFIX = { 'memory-club': 'mc', yangplanet: 'yp', stalolabs: 'sl', mba: 'mba' };
const VALID_PRIORITY = new Set(['red', 'yellow', 'green', 'white']);

function postTask(req, res) {
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return sendJSON(res, 400, { error: 'body inválido' }); }
    const { week, project, title, repo, priority, status, estimated_hours, notes } = payload;

    if (!WEEK_RE.test(week || '')) return sendJSON(res, 400, { error: 'week inválida' });
    if (!title || !String(title).trim()) return sendJSON(res, 400, { error: 'título obrigatório' });
    if (!VALID_PRIORITY.has(priority)) return sendJSON(res, 400, { error: 'prioridade inválida' });
    if (!VALID_STATUS.has(status)) return sendJSON(res, 400, { error: 'status inválido' });

    const file = planningPath(week);
    let json;
    try { json = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return sendJSON(res, 404, { error: 'planning não encontrado' }); }

    const proj = (json.projects || {})[project];
    if (!proj) return sendJSON(res, 400, { error: `projeto ${project} não existe nesta semana` });

    const prefix = ID_PREFIX[project];
    if (!prefix) return sendJSON(res, 400, { error: `projeto ${project} sem prefixo de id` });

    let hours = estimated_hours === '' || estimated_hours == null ? null : Number(estimated_hours);
    if (hours != null && (!isFinite(hours) || hours < 0)) return sendJSON(res, 400, { error: 'horas inválidas' });

    const task = {
      id: nextTaskId(prefix),
      title: String(title).trim(),
      repo: (repo && String(repo).trim()) || project,
      estimated_hours: hours,
      actual_hours: null,
      priority,
      status,
      carryover: false,
      notes: notes ? String(notes).trim() : '',
    };

    (proj.tasks = proj.tasks || []).push(task);

    fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8', (err) => {
      if (err) return sendJSON(res, 500, { error: 'falha ao gravar' });
      scheduleGenerate(week);
      scheduleSyncLayout(week);
      sendJSON(res, 200, { ok: true, task });
    });
  });
}

function getPlanning(res, week) {
  if (!WEEK_RE.test(week)) return sendJSON(res, 400, { error: 'week inválida' });
  fs.readFile(planningPath(week), 'utf8', (err, data) => {
    if (err) return sendJSON(res, 404, { error: 'planning não encontrado' });
    try {
      sendJSON(res, 200, JSON.parse(data));
    } catch (e) {
      sendJSON(res, 500, { error: 'JSON inválido no disco' });
    }
  });
}

function postStatus(req, res) {
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return sendJSON(res, 400, { error: 'body inválido' }); }
    const { week, taskId, status } = payload;
    if (!WEEK_RE.test(week || '')) return sendJSON(res, 400, { error: 'week inválida' });
    if (!VALID_STATUS.has(status)) return sendJSON(res, 400, { error: 'status inválido' });
    if (!taskId) return sendJSON(res, 400, { error: 'taskId ausente' });

    const file = planningPath(week);
    let json;
    try { json = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return sendJSON(res, 404, { error: 'planning não encontrado' }); }

    let found = false;
    for (const proj of Object.values(json.projects || {})) {
      for (const task of proj.tasks || []) {
        if (task.id === taskId) { task.status = status; found = true; }
      }
    }
    if (!found) return sendJSON(res, 404, { error: `task ${taskId} não encontrada` });

    fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8', (err) => {
      if (err) return sendJSON(res, 500, { error: 'falha ao gravar' });
      scheduleGenerate(week);
      sendJSON(res, 200, { ok: true, taskId, status });
    });
  });
}

// Grava um JSON de dados dentro de /blog (ex: gestao-tempo/week.json)
function postBlogData(req, res) {
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return sendJSON(res, 400, { error: 'body inválido' }); }
    const { file, data } = payload;
    if (typeof file !== 'string' || !BLOG_DATA_RE.test(file) || file.includes('..')) {
      return sendJSON(res, 400, { error: 'file inválido' });
    }
    if (!data || typeof data !== 'object') return sendJSON(res, 400, { error: 'data ausente' });

    const filePath = path.join(BLOG_DIR, file);
    if (!filePath.startsWith(BLOG_DIR + path.sep)) { return sendJSON(res, 403, { error: 'forbidden' }); }

    fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8', (err) => {
      if (err) return sendJSON(res, 500, { error: 'falha ao gravar' });
      sendJSON(res, 200, { ok: true, file });
    });
  });
}

function serveStatic(req, res) {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  if (rel === '/effort' || rel === '/effort/') rel = '/effort/index.html';
  // /blog/* e /effort/* são servidos a partir da raiz do repo; o resto vem de __planning-layout
  const fromBlog = rel.startsWith('/blog/');
  const fromEffort = rel.startsWith('/effort/');
  const baseDir = fromBlog || fromEffort ? ROOT : LAYOUT_DIR;
  const filePath = path.join(baseDir, rel);
  // Impede path traversal pra fora do diretório base
  const guard = fromBlog ? BLOG_DIR : fromEffort ? EFFORT_DIR : LAYOUT_DIR;
  if (!filePath.startsWith(guard)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'POST' && url === '/api/status') return postStatus(req, res);
  if (req.method === 'POST' && url === '/api/task') return postTask(req, res);
  if (req.method === 'POST' && url === '/api/blog-data') return postBlogData(req, res);
  const m = url.match(/^\/api\/planning\/([^/]+)$/);
  if (req.method === 'GET' && m) return getPlanning(res, m[1]);
  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(405); res.end('method not allowed');
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Planning viewer em ${url}  (status sincroniza com plannings/<week>/planning.json)`);
  if (process.platform === 'darwin' && !process.env.NO_OPEN) {
    execFile('open', [url], () => {});
  }
});
