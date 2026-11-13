// Static checks of the hardware databases (no browser needed).
// Run: node tests/check-data.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cpuSrc = fs.readFileSync(path.join(root, 'data', 'cpus.js'), 'utf8');
const gpuSrc = fs.readFileSync(path.join(root, 'data', 'gpus.js'), 'utf8');
const { cpuDatabase, gpuDatabase } = new Function(cpuSrc + gpuSrc + ';return { cpuDatabase, gpuDatabase };')();

const errors = [];
const fail = (msg) => errors.push(msg);

function selectOptions(id) {
  const i = html.indexOf(`<select id="${id}"`);
  if (i < 0) { fail(`select #${id} not found`); return []; }
  const end = html.indexOf('</select>', i);
  return [...html.slice(i, end).matchAll(/<option[^>]*value="([\w.]+)"/g)].map((m) => m[1]);
}

// 1. Duplicate keys (a JS object literal silently keeps only the last one)
for (const [name, src] of [['cpus.js', cpuSrc], ['gpus.js', gpuSrc]]) {
  const seen = new Set();
  for (const m of src.matchAll(/^    (\w+): \{/gm)) {
    if (seen.has(m[1])) fail(`${name}: duplicate key "${m[1]}"`);
    seen.add(m[1]);
  }
}

// 2. Dropdown <-> database consistency
const cpuOpts = selectOptions('select-cpu');
const gpuOpts = selectOptions('select-gpu');
cpuOpts.forEach((k) => { if (!cpuDatabase[k]) fail(`#select-cpu option "${k}" has no entry in cpus.js`); });
Object.keys(cpuDatabase).forEach((k) => { if (!cpuOpts.includes(k)) fail(`cpus.js entry "${k}" is not in #select-cpu`); });
gpuOpts.filter((k) => k !== 'igpu_auto').forEach((k) => { if (!gpuDatabase[k]) fail(`#select-gpu option "${k}" has no entry in gpus.js`); });
Object.entries(gpuDatabase).forEach(([k, g]) => {
  if (!g.igpu && !gpuOpts.includes(k)) fail(`gpus.js dedicated GPU "${k}" is not in #select-gpu`);
  if (g.igpu && gpuOpts.includes(k)) fail(`iGPU "${k}" should not be listed in #select-gpu`);
});

// 3. iGPU links
Object.entries(cpuDatabase).forEach(([k, c]) => {
  if (c.igpu && !gpuDatabase[c.igpu]) fail(`CPU "${k}" points to missing iGPU "${c.igpu}"`);
  if (c.igpu && gpuDatabase[c.igpu] && !gpuDatabase[c.igpu].igpu) fail(`CPU "${k}" igpu "${c.igpu}" is not flagged igpu: true`);
});
Object.entries(gpuDatabase).forEach(([k, g]) => {
  if (g.igpu && !Object.values(cpuDatabase).some((c) => c.igpu === k)) fail(`iGPU "${k}" is not used by any CPU`);
});

// 4. Schema
const ST = ['low', 'mid', 'high', 'top'];
const TIER = ['low', 'entry', 'mid', 'high', 'ultra'];
const num = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
Object.entries(cpuDatabase).forEach(([k, c]) => {
  if (typeof c.name !== 'string' || !c.name) fail(`CPU "${k}": missing name`);
  ['cores', 'threads', 'concGC', 'parGC', 'chunkThreads', 'fmlThreads'].forEach((f) => { if (!num(c[f])) fail(`CPU "${k}": invalid ${f}`); });
  if (c.threads < c.cores) fail(`CPU "${k}": threads < cores`);
  if (!ST.includes(c.st)) fail(`CPU "${k}": invalid st "${c.st}"`);
  if (typeof c.l3 !== 'string') fail(`CPU "${k}": invalid l3`);
  if (c.apple && !(c.memType && num(c.memFreq) && num(c.bw))) fail(`CPU "${k}": Apple chip needs memType, memFreq and bw`);
  if (c.apple && !c.igpu) fail(`CPU "${k}": Apple chip needs an igpu`);
});
Object.entries(gpuDatabase).forEach(([k, g]) => {
  if (typeof g.name !== 'string' || !g.name) fail(`GPU "${k}": missing name`);
  if (!['nvidia', 'amd', 'intel', 'apple'].includes(g.vendor)) fail(`GPU "${k}": invalid vendor "${g.vendor}"`);
  if (!num(g.vram)) fail(`GPU "${k}": invalid vram`);
  if (!TIER.includes(g.tier)) fail(`GPU "${k}": invalid tier "${g.tier}"`);
  if (typeof g.noErrorCtx !== 'boolean') fail(`GPU "${k}": noErrorCtx must be boolean`);
  if (g.igpu && !g.short) fail(`iGPU "${k}": missing short label`);
});

if (errors.length) {
  console.error(`check-data: ${errors.length} problem(s)`);
  errors.forEach((e) => console.error(' - ' + e));
  process.exit(1);
}
console.log(`check-data: OK (${Object.keys(cpuDatabase).length} CPUs, ${Object.keys(gpuDatabase).length} GPUs)`);
