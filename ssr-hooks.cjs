// Hooks AVANT require du bundle pour traquer timers perpétuels
const reqLog = [];
const origFetch = global.fetch;
if (origFetch) {
  global.fetch = (url, opts) => {
    const meta = { url: String(url).slice(0, 120), start: Date.now(), done: false };
    reqLog.push(meta);
    return origFetch(url, opts).then((r) => {
      meta.done = true; meta.status = r.status; meta.ms = Date.now() - meta.start;
      return r;
    }, (e) => {
      meta.done = true; meta.err = String(e).slice(0, 80); meta.ms = Date.now() - meta.start;
      throw e;
    });
  };
}
const httpMod = require('http');
const httpsMod = require('https');
const origReq = httpMod.request;
httpMod.request = (opts, cb) => {
  const url = typeof opts === 'string' ? opts : (opts.host || '') + (opts.path || '');
  const meta = { url: String(url).slice(0, 120), start: Date.now(), done: false, via: 'http.request' };
  reqLog.push(meta);
  const req = origReq(opts, (res) => {
    meta.done = true; meta.status = res.statusCode; meta.ms = Date.now() - meta.start;
    res.on('end', () => { meta.closeMs = Date.now() - meta.start; });
    if (cb) cb(res);
  });
  req.on('error', (e) => { meta.done = true; meta.err = String(e).slice(0, 80); meta.ms = Date.now() - meta.start; });
  return req;
};
const origHReq = httpsMod.request;
httpsMod.request = (opts, cb) => {
  const url = typeof opts === 'string' ? opts : (opts.host || '') + (opts.path || '');
  const meta = { url: String(url).slice(0, 120), start: Date.now(), done: false, via: 'https.request' };
  reqLog.push(meta);
  const req = origHReq(opts, (res) => {
    meta.done = true; meta.status = res.statusCode; meta.ms = Date.now() - meta.start;
    if (cb) cb(res);
  });
  req.on('error', (e) => { meta.done = true; meta.err = String(e).slice(0, 80); meta.ms = Date.now() - meta.start; });
  return req;
};

const intervals = new Map();
let bootedAt = Date.now();
const timeouts = new Map();
let intervalIds = 0;
let timeoutIds = 0;

const origSetInterval = global.setInterval.bind(global);
const origClearInterval = global.clearInterval.bind(global);
const origSetTimeout = global.setTimeout.bind(global);
const origClearTimeout = global.clearTimeout.bind(global);

global.setInterval = (fn, ms, ...a) => {
  const id = intervalIds++;
  const stack = new Error().stack.split('\n').slice(1, 8).join('\n  ');
  intervals.set(id, { fn: String(fn).slice(0, 160), ms, active: true, stack, createdAt: Date.now(), bootedAt });
  intervals.set('orig' + id, origSetInterval((...args) => {
    if (intervals.get(id)) intervals.get(id).lastRunAt = Date.now();
    return fn(...args);
  }, ms, ...a));
  return id;
};
global.clearInterval = (id) => {
  const rec = intervals.get(id);
  if (rec) { rec.active = false; origClearInterval(intervals.get('orig' + id)); }
};
global.setTimeout = (fn, ms, ...a) => {
  if (typeof ms === 'number' && ms >= 60000) {
    const id = timeoutIds++;
    timeouts.set(id, { fn: String(fn).slice(0, 160), ms, active: true });
    timeouts.set('orig' + id, origSetTimeout(fn, ms, ...a));
    return id;
  }
  return origSetTimeout(fn, ms, ...a);
};

const { app } = require('./dist/app/server/main.js');
const http = require('http');
const server = http.createServer(app());
const route = process.argv[2] || '/fr/home';

server.listen(4106, () => {
  console.log('HOOKS listening on', route);
  const req = http.get({ host: 'localhost', port: 4106, path: route }, (res) => {
    res.resume();
    res.on('end', () => {
      console.log('RESPONDED');
      setTimeout(() => { report(); }, 1500);
    });
  });
  if (process.env.NOCLEAR !== '1') setTimeout(() => {
    console.log('T+8s : effacement des intervalles vivants pour test');
    [...intervals.values()].filter(r => r.active).forEach(r => {
      console.log('  clear interval', r.ms + 'ms', r.fn);
      r.active = false;
      clearInterval(global.__LAST_CLEAR_ID__ || 0);
    });
    // clear effectifs
    intervals.forEach((v, k) => {
      if (String(k).startsWith('orig')) { try { origClearInterval(v); } catch {} }
    });
  }, 8000);
  setTimeout(() => {
    console.log('STILL PENDING after 12s — live intervals:');
    report(true);
    server.close();
    reqLog.forEach(r => console.log('[REQ]', r.done ? 'DONE' : 'PENDING', r.status || '', r.ms || '', r.url, r.err || ''));
    process.exit(0);
  }, 12000);
  req.on('error', () => {});
});

function report(onlyLive) {
  const live = [...intervals.values()].filter(r => r.active);
  console.log('live setInterval count:', live.length);
  live.forEach(r => {
    console.log('  [', r.ms + 'ms', '] age=' + (Date.now() - (r.createdAt || bootedAt)) + 'ms', r.fn);
    if (r.stack) console.log('      at', r.stack.replace(/\n\s*/g, '\n      at '));
  });
  const bigTimers = [...timeouts.values()].filter(t => t.active);
  console.log('live long setTimeouts (>=60s):', bigTimers.length);
  bigTimers.forEach(t => console.log('  [', t.ms + 'ms', ']', t.fn));
}