var fs = require('fs');
var c = fs.readFileSync('f:/Projet/Ndewa360/src/frontend-v2/src/assets/i18n/fr.json', 'utf8');
var lines = c.split('\n');

console.log('=== ANALYSE fr.json ===');
console.log('Lignes:', lines.length, '| Chars:', c.length);

// 1. Compter les accolades et crochets
var opens = 0, closes = 0, arrOpen = 0, arrClose = 0;
var inStr = false, esc = false;
var lineNum = 1;
var unbalanced = [];

for (var i = 0; i < c.length; i++) {
  var ch = c[i];
  if (ch === '\n') lineNum++;
  if (esc) { esc = false; continue; }
  if (ch === '\\' && inStr) { esc = true; continue; }
  if (ch === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (ch === '{') opens++;
  if (ch === '}') closes++;
  if (ch === '[') arrOpen++;
  if (ch === ']') arrClose++;
}

console.log('\n=== ACCOLADES ===');
console.log('{ ouvertes:', opens, '| } fermees:', closes, '| Diff:', opens - closes);
console.log('[ ouvertes:', arrOpen, '| ] fermees:', arrClose, '| Diff:', arrOpen - arrClose);

// 2. Chercher les virgules manquantes entre objets
var problems = [];
for (var i = 0; i < lines.length - 1; i++) {
  var curr = lines[i].replace(/\r/, '').trimRight();
  var next = lines[i + 1].replace(/\r/, '').trimLeft();
  // Ligne qui finit par } ou ] ou " sans virgule, suivie d'une clé
  if ((curr.endsWith('}') || curr.endsWith(']') || curr.endsWith('"')) &&
      (next.startsWith('"') || next.startsWith('{') || next.startsWith('['))) {
    problems.push({ line: i + 1, curr: curr.slice(-30), next: next.slice(0, 30) });
  }
}
console.log('\n=== VIRGULES MANQUANTES POTENTIELLES ===');
console.log('Trouvees:', problems.length);
problems.slice(0, 20).forEach(function(p) {
  console.log('  Ligne ' + p.line + ': ...' + p.curr + ' | ' + p.next + '...');
});

// 3. Chercher les virgules en trop (trailing commas)
var trailing = [];
for (var i = 0; i < lines.length - 1; i++) {
  var curr = lines[i].replace(/\r/, '').trimRight();
  var next = lines[i + 1].replace(/\r/, '').trimLeft();
  if (curr.endsWith(',') && (next.startsWith('}') || next.startsWith(']'))) {
    trailing.push({ line: i + 1, curr: curr.slice(-40), next: next.slice(0, 20) });
  }
}
console.log('\n=== VIRGULES EN TROP (trailing commas) ===');
console.log('Trouvees:', trailing.length);
trailing.slice(0, 20).forEach(function(p) {
  console.log('  Ligne ' + p.line + ': ...' + p.curr + ' | ' + p.next);
});

// 4. Chercher les lignes avec des caracteres de controle
var ctrlChars = [];
for (var i = 0; i < lines.length; i++) {
  var l = lines[i];
  for (var j = 0; j < l.length; j++) {
    var code = l.charCodeAt(j);
    if (code < 32 && code !== 9 && code !== 13) {
      ctrlChars.push({ line: i + 1, col: j, code: code });
    }
  }
}
console.log('\n=== CARACTERES DE CONTROLE ===');
console.log('Trouves:', ctrlChars.length);
ctrlChars.slice(0, 10).forEach(function(p) {
  console.log('  Ligne ' + p.line + ' col ' + p.col + ': code ' + p.code);
});

// 5. Chercher la section HEADER pour verifier la modification recente
var headerIdx = -1;
for (var i = 0; i < lines.length; i++) {
  if (lines[i].replace(/\r/, '').trim() === '"HEADER": {') {
    headerIdx = i;
    break;
  }
}
if (headerIdx > -1) {
  console.log('\n=== SECTION HEADER (lignes ' + (headerIdx+1) + ' a ' + (headerIdx+20) + ') ===');
  lines.slice(headerIdx, headerIdx + 20).forEach(function(l, i) {
    console.log((headerIdx + i + 1) + ': ' + l.replace(/\r/, ''));
  });
}
