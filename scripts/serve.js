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
  // /blog/* é servido a partir da raiz do repo; o resto vem de __planning-layout
  const fromBlog = rel.startsWith('/blog/');
  const baseDir = fromBlog ? ROOT : LAYOUT_DIR;
  const filePath = path.join(baseDir, rel);
  // Impede path traversal pra fora do diretório base
  const guard = fromBlog ? BLOG_DIR : LAYOUT_DIR;
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
