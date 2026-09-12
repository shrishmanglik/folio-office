import { FormulaEngine } from './formulas.mjs';
import { formulaInput } from './cells.mjs';
const MAX_ROWS = 10000, MAX_COLS = 1000, MAX_CELLS = 10000;
function fail(message, code = 'INVALID_INPUT') { throw Object.assign(new Error(message), { code }); }
function letters(c) { let out = ''; for (let n = c + 1; n; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out; return out; }
function address(r, c) { return letters(c) + (r + 1); }
function point(value) {
  const m = /^([A-Z]{1,3})([1-9][0-9]{0,4})$/i.exec(value || '');
  if (!m) fail('Use an A1 cell address.');
  const c = [...m[1].toUpperCase()].reduce((n, x) => n * 26 + x.charCodeAt(0) - 64, 0) - 1, r = Number(m[2]) - 1;
  if (r >= MAX_ROWS || c >= MAX_COLS) fail('Worksheet bounds are 10000 rows and 1000 columns.');
  return { r, c };
}
function rectangle(value) {
  if (typeof value !== 'string' || value.length > 32) fail('A range is required.');
  const parts = value.split(':'); if (parts.length > 2) fail('Use a forward A1 rectangle.');
  const a = point(parts[0]), b = point(parts[1] || parts[0]);
  if (b.r < a.r || b.c < a.c || (b.r - a.r + 1) * (b.c - a.c + 1) > MAX_CELLS) fail('Select a forward rectangle of at most 10000 cells.');
  return { a, b };
}
const formula = value => typeof value === 'string' && value.startsWith('=');
// Split string literals before interpreting references, including Excel's escaped double quotes.
function mapFormula(value, transform) {
  if (!formula(value)) return value;
  let result = '', code = '';
  for (let i = 0; i < value.length;) {
    const ch = value[i];
    if (ch === "'") {
      const start = i++; let closed = false;
      while (i < value.length) { if (value[i++] === "'") { if (value[i] === "'") { i++; continue; } closed = true; break; } }
      if (!closed) fail('Unterminated quoted sheet identifier.', 'UNSUPPORTED_OPERATION');
      code += value.slice(start, i);
    } else if (ch === '"') {
      result += transform(code); code = ''; const start = i++; let closed = false;
      while (i < value.length) { if (value[i++] === '"') { if (value[i] === '"') { i++; continue; } closed = true; break; } }
      if (!closed) fail('Unterminated formula string literal.', 'UNSUPPORTED_OPERATION');
      result += value.slice(start, i);
    } else { code += ch; i++; }
  }
  return result + transform(code);
}
function supportedReferences(chunk) {
  if (/[\[\]]/.test(chunk) || /(?:'[^']*'|[\w.]+):(?:'[^']*'|[\w.]+)!/.test(chunk)) fail('External and 3D references are not supported by this edit.', 'UNSUPPORTED_OPERATION');
}
function renameReferences(value, oldName, name) {
  return mapFormula(value, chunk => {
    supportedReferences(chunk);
    if (/\bINDIRECT\s*\(/i.test(chunk)) fail('Dynamic INDIRECT references prevent safe sheet identity edits.', 'UNSUPPORTED_OPERATION');
    const qualifiers = /'((?:[^']|'')+)'!|(?<![\w.])([A-Za-z_][A-Za-z0-9_.]*)!/g;
    if (chunk.replace(qualifiers, '').includes('!')) fail('Unsupported sheet reference syntax.', 'UNSUPPORTED_OPERATION');
    return chunk.replace(/'((?:[^']|'')+)'!|(?<![\w.])([A-Za-z_][A-Za-z0-9_.]*)!/g, (match, quoted, bare) => {
      const found = quoted === undefined ? bare : quoted.replace(/''/g, "'");
      return found.toLowerCase() === oldName.toLowerCase() ? "'" + name.replace(/'/g, "''") + "'!" : match;
    });
  });
}
export function translateFormula(value, dr, dc) {
  return mapFormula(value, chunk => {
    supportedReferences(chunk);
    if (/\$?[A-Z]+:\$?[A-Z]+|\$?\d+:\$?\d+/i.test(chunk)) fail('Fill of whole-row or whole-column references is not supported.', 'UNSUPPORTED_OPERATION');
    return chunk.replace(/'(?:[^']|'')+'!|(?<![\w.])[A-Za-z_][A-Za-z0-9_.]*!|(?<![\w.])\$?[A-Z]{1,3}\$?[1-9][0-9]*(?![\w.(])/gi, token => {
      if (token.endsWith('!')) return token;
      const m = /^(\$?)([A-Z]+)(\$?)([0-9]+)$/i.exec(token);
      const p = point(m[2] + m[4]), r = p.r + (m[3] ? 0 : dr), c = p.c + (m[1] ? 0 : dc);
      if (r < 0 || c < 0 || r >= MAX_ROWS || c >= MAX_COLS) fail('Filled formula would reference outside supported worksheet bounds.', 'UNSUPPORTED_OPERATION');
      return m[1] + letters(c) + m[3] + (r + 1);
    });
  });
}
function validName(name, sheets, exceptId) {
  if (typeof name !== 'string' || !name.trim() || name.length > 31 || /[\\/?*\[\]:\x00-\x1f]/.test(name) || name.startsWith("'") || name.endsWith("'")) fail('Use a sheet name of 1 to 31 characters without reserved characters.');
  if (sheets.some(s => s.id !== exceptId && s.name.toLowerCase() === name.toLowerCase())) fail('Sheet names must be unique, ignoring case.');
  return name;
}
function put(sheet, r, c, value) { while (sheet.cells.length <= r) sheet.cells.push([]); while (sheet.cells[r].length <= c) sheet.cells[r].push(''); sheet.cells[r][c] = value; }
function allFormulas(data, fn) { for (const sheet of data.sheets) for (const row of sheet.cells) for (let c = 0; c < row.length; c++) if (formula(row[c])) row[c] = fn(row[c]); }
export function applySpreadsheetCommand(data, command) {
  if (!data || !Array.isArray(data.sheets) || !data.sheets.length || data.sheets.length > 100) fail('Workbook needs 1 to 100 sheets.');
  if (!command || typeof command !== 'object' || typeof command.action !== 'string') fail('An edit action is required.');
  const ids = new Set(), names = new Set();
  for (const sheet of data.sheets) {
    if (typeof sheet.id !== 'string' || !sheet.id || sheet.id.length > 128 || ids.has(sheet.id) || typeof sheet.name !== 'string' || names.has(sheet.name.toLowerCase())) fail('Sheet identifiers and names must be unique.');
    ids.add(sheet.id); names.add(sheet.name.toLowerCase());
    if (!Array.isArray(sheet.cells) || sheet.cells.length > MAX_ROWS || sheet.cells.some(row => !Array.isArray(row) || row.length > MAX_COLS || row.some(v => v !== null && !['string','number','boolean'].includes(typeof v)))) fail('Invalid sheet cell matrix.');
  }
  const out = structuredClone(data), id = command.sheetId ?? data.activeSheet ?? data.sheets[0].id;
  if (typeof id !== 'string' || !id || id.length > 128) fail('Use a valid sheet ID.');
  const index = out.sheets.findIndex(s => s.id === id), sheet = out.sheets[index]; if (!sheet) fail('Sheet ID was not found.');
  out.activeSheet = id;
  const action = command.action;
  if (action === 'copyRange') {
    const {a,b}=rectangle(command.range), dest=point(command.target);
    if (!['all','values','formulas','formats'].includes(command.mode)) fail('Choose all, values, formulas or formats.');
    for (const key of ['transpose','skipBlanks']) if(command[key]!==undefined && typeof command[key]!=='boolean') fail(key+' must be a boolean.');
    const target=out.sheets.find(s=>s.id===(command.targetSheetId??id)); if(!target) fail('Destination sheet was not found.');
    const height=b.r-a.r+1,width=b.c-a.c+1,dh=command.transpose?width:height,dw=command.transpose?height:width;
    if(dest.r+dh>MAX_ROWS||dest.c+dw>MAX_COLS) fail('Destination exceeds worksheet bounds.');
    // Read the complete source before writing, so overlapping copies are deterministic.
    const source=data.sheets[index], copied=[]; let calc;
    try {
      if(command.mode==='values' && source.cells.slice(a.r,b.r+1).some(row=>row.slice(a.c,b.c+1).some(formula))) calc=FormulaEngine.buildFromSheets(Object.fromEntries(data.sheets.map(s=>[s.name,s.cells.map(row=>row.map(formulaInput))])));
      for(let r=a.r;r<=b.r;r++) for(let c=a.c;c<=b.c;c++) {
        let value=source.cells[r]?.[c]??'';
        const dr=dest.r+(command.transpose?c-a.c:r-a.r),dc=dest.c+(command.transpose?r-a.r:c-a.c);
        if(command.skipBlanks && (value===''||value===null)) continue;
        if(command.mode==='values' && formula(value)) {value=calc.getCellValue({sheet:calc.getSheetId(source.name),row:r,col:c});if(value&&typeof value==='object')value=value.value;else if(typeof value==='string')value="'"+value;value=value===null?'':String(value);}
        else if(command.mode!=='formats') value=translateFormula(value,dr-r,dc-c);
        copied.push({r:dr,c:dc,value,style:source.styles?.[address(r,c)]});
      }
    } finally {calc?.destroy();}
    target.styles??={};
    for(const item of copied) {
      if(command.mode!=='formats')put(target,item.r,item.c,item.value);
      if(['all','formats'].includes(command.mode)) {if(item.style)target.styles[address(item.r,item.c)]=structuredClone(item.style);else delete target.styles[address(item.r,item.c)];}
    }
    target.rows=Math.max(target.rows||1,dest.r+dh);target.cols=Math.max(target.cols||1,dest.c+dw);
  } else if (action === 'sheetRename') {
    const name = validName(command.name, out.sheets, id);
    allFormulas(out, value => renameReferences(value, sheet.name, name)); sheet.name = name;
  } else if (action === 'sheetDuplicate') {
    if (out.sheets.length >= 100) fail('Workbook already has 100 sheets.');
    let name = command.name;
    if (name === undefined) { for (let n = 2; ; n++) { name = sheet.name.slice(0, 31 - (` (${n})`).length) + ` (${n})`; if (!out.sheets.some(s => s.name.toLowerCase() === name.toLowerCase())) break; } }
    validName(name, out.sheets);
    const copy = structuredClone(sheet); let n = 2; while (ids.has(`sheet-copy-${n}`)) n++; copy.id = `sheet-copy-${n}`; copy.name = name;
    // Explicit self-references in a copied sheet follow its new identity.
    for (const row of copy.cells) for (let c = 0; c < row.length; c++) row[c] = renameReferences(row[c], sheet.name, name);
    out.sheets.splice(index + 1, 0, copy); out.activeSheet = copy.id;
  } else if (action === 'sheetMove') {
    if (!Number.isInteger(command.toIndex) || command.toIndex < 0 || command.toIndex >= out.sheets.length) fail('toIndex must identify a position in the workbook.');
    // Moving sheets changes 3D reference membership, so fail closed for those formulas.
    allFormulas(out, value => mapFormula(value, chunk => { supportedReferences(chunk); return chunk; }));
    out.sheets.splice(index, 1); out.sheets.splice(command.toIndex, 0, sheet);
  } else if (action === 'sheetDelete') {
    if (out.sheets.length === 1) fail('Keep at least one sheet.');
    for (const other of out.sheets) if (other.id !== id) for (const row of other.cells) for (const value of row) if (renameReferences(value, sheet.name, sheet.name + '__reference_probe__') !== value) fail('This sheet is referenced by a formula. Remove those references before deleting it.', 'UNSUPPORTED_OPERATION');
    out.sheets.splice(index, 1); if (out.activeSheet === id) out.activeSheet = out.sheets[Math.min(index, out.sheets.length - 1)].id;
  } else if (['clear', 'fill', 'sort', 'replace'].includes(action)) {
    const { a, b } = rectangle(command.range); sheet.styles ??= {};
    if (action === 'clear') {
      if (!['contents','formats','all'].includes(command.mode)) fail('Choose contents, formats or all.');
      for (let r = a.r; r <= b.r; r++) for (let c = a.c; c <= b.c; c++) { if (command.mode !== 'formats') put(sheet, r, c, ''); if (command.mode !== 'contents') delete sheet.styles[address(r,c)]; }
    } else if (action === 'fill') {
      if (!['down','right','up','left'].includes(command.direction)) fail('Fill direction must be down, right, up or left.');
      const source = data.sheets[index];
      for (let r = a.r; r <= b.r; r++) for (let c = a.c; c <= b.c; c++) {
        const sr = command.direction === 'down' ? a.r : command.direction === 'up' ? b.r : r, sc = command.direction === 'right' ? a.c : command.direction === 'left' ? b.c : c;
        put(sheet, r, c, translateFormula(source.cells[sr]?.[sc] ?? '', r-sr, c-sc));
        const style = source.styles?.[address(sr,sc)]; if (style) sheet.styles[address(r,c)] = structuredClone(style); else delete sheet.styles[address(r,c)];
      }
    } else if (action === 'replace') {
      if (typeof command.find !== 'string' || !command.find.length || command.find.length > 4096 || typeof command.replacement !== 'string' || command.replacement.length > 4096) fail('Find needs 1 to 4096 characters; replacement may be empty.');
      if ((command.matchCase !== undefined && typeof command.matchCase !== 'boolean') || (command.wholeCell !== undefined && typeof command.wholeCell !== 'boolean')) fail('Match case and whole cell must be booleans.');
      // Literal matching avoids regular-expression execution and treats replacement dollar signs as data.
      const escaped = command.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matcher = new RegExp(command.wholeCell ? '^(?:' + escaped + ')$' : escaped, command.matchCase ? 'g' : 'gi');
      for (let r = a.r; r <= b.r; r++) for (let c = a.c; c <= b.c; c++) {
        const value = sheet.cells[r]?.[c];
        if (typeof value === 'string') put(sheet, r, c, value.replace(matcher, () => command.replacement));
      }
    } else {
      if (!Number.isInteger(command.keyColumn) || command.keyColumn < a.c || command.keyColumn > b.c || !['asc','desc'].includes(command.direction) || typeof command.hasHeader !== 'boolean') fail('Sort requires a key column within the range, asc or desc, and hasHeader.');
      for (let r = a.r; r <= b.r; r++) for (let c = a.c; c <= b.c; c++) if (formula(sheet.cells[r]?.[c])) fail('Sorting formula cells is not supported because references need structural remapping.', 'UNSUPPORTED_OPERATION');
      const rows = []; for (let r = a.r + (command.hasHeader ? 1 : 0); r <= b.r; r++) rows.push({ r, key: sheet.cells[r]?.[command.keyColumn] ?? '', values: Array.from({ length:b.c-a.c+1 }, (_,i) => sheet.cells[r]?.[a.c+i] ?? ''), styles: Array.from({ length:b.c-a.c+1 }, (_,i) => sheet.styles[address(r,a.c+i)]) });
      rows.sort((x,y) => { const sx=String(x.key), sy=String(y.key); if (!sx.trim() || !sy.trim()) return !sx.trim() && !sy.trim() ? x.r-y.r : !sx.trim() ? 1 : -1; const nx=Number(sx),ny=Number(sy); const cmp=Number.isFinite(nx)&&Number.isFinite(ny)?nx-ny:sx.localeCompare(sy, 'en', {numeric:true,sensitivity:'base'}); return cmp ? (command.direction==='desc'?-cmp:cmp) : x.r-y.r; });
      rows.forEach((record,i) => { const r=a.r+(command.hasHeader?1:0)+i; record.values.forEach((v,j) => { const c=a.c+j; put(sheet,r,c,v); if(record.styles[j]) sheet.styles[address(r,c)]=record.styles[j]; else delete sheet.styles[address(r,c)]; }); });
    }
    sheet.rows = Math.max(sheet.rows || 1, b.r+1); sheet.cols = Math.max(sheet.cols || 1, b.c+1);
  } else fail('Unsupported spreadsheet action: ' + action, 'UNSUPPORTED_OPERATION');
  return out;
}
