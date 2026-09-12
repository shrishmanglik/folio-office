import { useEffect, useMemo, useRef, useState } from 'react';
import { FormulaEngine } from '../../shared/formulas.mjs';
import ExcelJS from 'exceljs';
import { Download, Upload, Plus, Undo2, Redo2, ChevronDown } from 'lucide-react';
import type { EditorProps } from '../types';
import { downloadFile } from '../io';
import { formulaInput, importedText } from '../../shared/cells.mjs';
import { applySpreadsheetCommand } from '../../shared/spreadsheet-operations.mjs';
import { applyCellFormatting, NUMBER_FORMAT_PRESETS } from '../../shared/cell-styles.mjs';
import SpreadsheetTransfer from './SpreadsheetTransfer';
import './SpreadsheetEditor.css';

type CellStyle = { bold?: boolean; italic?: boolean; numberFormat?: string; fill?: string; color?: string; align?: 'left' | 'center' | 'right'; fontFamily?: string; fontSize?: number; underline?: boolean; strike?: boolean; verticalAlign?: 'top' | 'middle' | 'bottom'; wrap?: boolean; indent?: number; rotation?: number; border?: 'none' | 'all' | 'outside' | 'bottom'; borderColor?: string; borders?: Partial<Record<'top' | 'right' | 'bottom' | 'left', string>> };
type Sheet = { styles?: Record<string, CellStyle>; id: string; name: string; cells: string[][]; rows?: number; cols?: number };
export type SpreadsheetData = { sheets: Sheet[]; activeSheet?: string };
const blank = (): SpreadsheetData => ({ sheets: [{ id: 'sheet-1', name: 'Sheet1', cells: [], rows: 40, cols: 16 }], activeSheet: 'sheet-1' });
const colName = (index: number): string => { let name = ''; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name; return name; };
const csvEscape = (v: string) => /[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [[]]; let value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && (quoted || !value)) { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (char === delimiter || char === '\n' || char === '\r')) {
      rows[rows.length - 1].push(value); value = '';
      if (char !== delimiter) { if (char === '\r' && text[i + 1] === '\n') i++; rows.push([]); }
    } else value += char;
  }
  rows[rows.length - 1].push(value);
  if (rows.length > 1 && rows.at(-1)?.length === 1 && rows.at(-1)?.[0] === '') rows.pop();
  return rows;
}
function displayValue(value: string, format = 'General'): string {
  if (value === '' || !Number.isFinite(Number(value)) || format === 'General' || format === '@') return value;
  const n = Number(value);
  if (format === '0') return n.toFixed(0);
  if (format === '0.00') return n.toFixed(2);
  if (format === '0.000') return n.toFixed(3);
  if (format === '0.00%') return `${(n * 100).toFixed(2)}%`;
  if (format === '#,##0' || format === '#,##0.00') return new Intl.NumberFormat('en-US', { minimumFractionDigits: format.endsWith('.00') ? 2 : 0, maximumFractionDigits: format.endsWith('.00') ? 2 : 0 }).format(n);
  if (format === '0.00E+00') return n.toExponential(2).toUpperCase().replace(/E([+-])(\d)$/, (_match, sign, digit) => `E${sign}0${digit}`);
  if (format === 'yyyy-mm-dd') { const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000); return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : value; }
  if (format === '0%') return `${(n * 100).toFixed(0)}%`;
  if (format === '$#,##0.00') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  return value;
}
export default function SpreadsheetEditor({ file, onChange }: EditorProps) {
  const data: SpreadsheetData = file.data?.sheets?.length ? file.data : blank();
  const [activeId, setActiveId] = useState(data.activeSheet || data.sheets[0].id);
  const sheet = data.sheets.find(s => s.id === activeId) || data.sheets[0];
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [rangeEnd, setRangeEnd] = useState<{row:number;col:number}|null>(null);
  const [rangeDraft, setRangeDraft] = useState('A1');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  const [freezeFirstRow, setFreezeFirstRow] = useState(false);
  const address = `${colName(selected.col)}${selected.row + 1}`;
  const bounds = { top: Math.min(selected.row, rangeEnd?.row ?? selected.row), bottom: Math.max(selected.row, rangeEnd?.row ?? selected.row), left: Math.min(selected.col, rangeEnd?.col ?? selected.col), right: Math.max(selected.col, rangeEnd?.col ?? selected.col) };
  const rangeAddress = `${colName(bounds.left)}${bounds.top + 1}${rangeEnd ? ':' + colName(bounds.right) + (bounds.bottom + 1) : ''}`;
  useEffect(() => { setRangeDraft(rangeAddress); }, [rangeAddress]);
  useEffect(() => { setRangeEnd(null); }, [sheet.id, file.id]);
  const selectedStyle = sheet.styles?.[address] || {};
  const [sortHeader, setSortHeader] = useState(true);
  const [sortColumn, setSortColumn] = useState(0);
  const [sheetNameDraft, setSheetNameDraft] = useState(sheet.name);
  const [confirmSheetDelete, setConfirmSheetDelete] = useState(false);
  const sheetMenu = useRef<HTMLDetailsElement>(null);
  const formatMenu = useRef<HTMLDetailsElement>(null);
  const replaceMenu = useRef<HTMLDetailsElement>(null);
  const [findText, setFindText] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeCell, setWholeCell] = useState(false);
  const [borderColor, setBorderColor] = useState('#243330');
  useEffect(() => { setSheetNameDraft(sheet.name); setConfirmSheetDelete(false); }, [sheet.id, sheet.name]);
  useEffect(() => { setSortColumn(bounds.left); }, [bounds.left, bounds.right]);
  const [busy, setBusy] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const history = useRef<{ past: SpreadsheetData[]; future: SpreadsheetData[] }>({ past: [], future: [] });
  const cancelCommit = useRef(false);
  const importer = useRef<HTMLInputElement>(null);
  const exportMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => { for (const menu of [exportMenu, formatMenu, replaceMenu, sheetMenu]) if (!menu.current?.contains(event.target as Node)) menu.current?.removeAttribute('open'); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') for (const menu of [exportMenu, formatMenu, replaceMenu, sheetMenu]) if (menu.current?.open) { menu.current.removeAttribute('open'); menu.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, []);
  const grid = useRef<HTMLDivElement>(null);
  const raw = sheet.cells[selected.row]?.[selected.col] || '';
  useEffect(() => { grid.current?.querySelector(`[data-cell="${colName(rangeEnd?.col ?? selected.col)}${(rangeEnd?.row ?? selected.row)+1}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [selected, rangeEnd, sheet.id]);
  useEffect(() => { setDraft(raw); }, [raw, selected.row, selected.col, sheet.id]);
  useEffect(() => { setActiveId(data.activeSheet || data.sheets[0].id); setSelected({ row: 0, col: 0 }); setEditing(false); history.current = { past: [], future: [] }; }, [file.id]);
  const rowCount = Math.max(40, sheet.rows || 0, sheet.cells.length);
  const colCount = Math.max(16, sheet.cols || 0, ...sheet.cells.map(r => r.length));
  const computed = useMemo(() => {
    let engine: FormulaEngine | undefined;
    try {
      engine = FormulaEngine.buildFromSheets(Object.fromEntries(data.sheets.map(s => [s.name, s.cells.map(row => row.map(formulaInput))])));
      const result: Record<string, string[][]> = {};
      const numeric: Record<string, boolean[][]> = {};
      for (const s of data.sheets) {
        const id = engine.getSheetId(s.name)!;
        numeric[s.id] = [];
        result[s.id] = s.cells.map((row, r) => row.map((_value, col) => {
          const value = engine!.getCellValue({ sheet: id, row: r, col });
          (numeric[s.id][r] ||= [])[col] = typeof value === 'number';
          if (value === null) return '';
          if (typeof value === 'object') return value.value;
          return typeof value === 'number' ? String(Number(value.toPrecision(12))) : String(value);
        }));
      }
      return { values: result, numeric, error: '' };
    } catch (e) { return { values: {} as Record<string, string[][]>, numeric: {} as Record<string, boolean[][]>, error: e instanceof Error ? e.message : 'Formula calculation failed' }; }
    finally { engine?.destroy(); }
  }, [file.data]);
  function change(next: SpreadsheetData) {
    history.current.past.push(structuredClone(data));
    if (history.current.past.length > 60) history.current.past.shift();
    history.current.future = []; setHistoryVersion(historyVersion + 1); onChange(next);
  }
  function updateSheet(next: Sheet) { change({ ...data, activeSheet: next.id, sheets: data.sheets.map(s => s.id === next.id ? next : s) }); }
  function eachSelected(fn: (row: number, col: number) => void) { for (let r=bounds.top;r<=bounds.bottom;r++) for(let c=bounds.left;c<=bounds.right;c++) fn(r,c); }
  function formatCell(patch: Partial<CellStyle>) { try { change(applyCellFormatting(data, { sheetId: sheet.id, range: rangeAddress, style: patch })); setMessage(`Formatted ${rangeAddress}. Undo is available.`); } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); } }
  function editSelection(action: string, options: Record<string, unknown> = {}) {
    try {
      const next = applySpreadsheetCommand({ ...data, activeSheet: sheet.id }, { action, sheetId: sheet.id, range: rangeAddress, ...options });
      change(next); setActiveId(next.activeSheet || sheet.id); setEditing(false); setConfirmSheetDelete(false);
      setMessage(action.startsWith('sheet') ? 'Worksheet updated. Undo is available.' : `Updated ${rangeAddress}. Undo is available.`);
      if(action.startsWith('sheet')) { sheetMenu.current?.removeAttribute('open'); setSelected({row:0,col:0}); setRangeEnd(null); }
    } catch(error) { setMessage(error instanceof Error ? error.message : String(error)); }
  }
  function clearFormatting() { editSelection('clear', {mode:'formats'}); }

  function selectRange() {
    const match=/^([A-Z]+)([1-9]\d*)(?::([A-Z]+)([1-9]\d*))?$/i.exec(rangeDraft.trim());
    const column=(v:string)=>[...v.toUpperCase()].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
    if(!match){setMessage('Use a cell or range, such as B3 or A1:D10.');return;}
    const start={row:Number(match[2])-1,col:column(match[1])}, end={row:Number(match[4]||match[2])-1,col:column(match[3]||match[1])};
    if(Math.max(start.row,end.row)>=rowCount||Math.max(start.col,end.col)>=colCount){setMessage('This range is outside the current grid. Add rows or columns first.');return;}
    setSelected(start);setRangeEnd(match[3]?end:null);setEditing(false);grid.current?.focus();
  }
  function insertSummaryFormula(fn:string) {
    const row=bounds.bottom+1,col=bounds.left;
    if(sheet.cells[row]?.[col]){setMessage(`Cell ${colName(col)}${row+1} already contains data. Clear it or choose another range.`);return;}
    writeCells([[`=${fn}(${colName(bounds.left)}${bounds.top+1}:${colName(bounds.right)}${bounds.bottom+1})`]],row,col);
    setSelected({row,col});setRangeEnd(null);setMessage(`${fn} inserted below the selection.`);
  }
  const selectionValues: number[]=[]; let selectionCount=0;
  eachSelected((r,c)=>{ if(sheet.cells[r]?.[c])selectionCount++; if(computed.numeric[sheet.id]?.[r]?.[c])selectionValues.push(Number(computed.values[sheet.id][r][c])); });
  let mixedFormatting = false; eachSelected((r,c) => { if (JSON.stringify(sheet.styles?.[`${colName(c)}${r+1}`] || {}) !== JSON.stringify(selectedStyle)) mixedFormatting = true; });
  const selectionSum=selectionValues.reduce((a,b)=>a+b,0);

  function writeCells(values: string[][], row = selected.row, col = selected.col) {
    const cells = sheet.cells.map(r => [...r]);
    values.forEach((line, dr) => { while (cells.length <= row + dr) cells.push([]); line.forEach((v, dc) => { while (cells[row + dr].length <= col + dc) cells[row + dr].push(''); cells[row + dr][col + dc] = v; }); });
    updateSheet({ ...sheet, cells });
  }
  function commit() { if (cancelCommit.current) { cancelCommit.current = false; return; } if (draft !== raw) writeCells([[draft]]); setEditing(false); }
  const visibleRows = Array.from({ length: rowCount }, (_, r) => r).filter(r => !filter.trim() || sheet.cells[r]?.some((v, c) => `${v} ${computed.values[sheet.id]?.[r]?.[c] || ''}`.toLowerCase().includes(filter.trim().toLowerCase())));
  function move(dr: number, dc: number, extend=false) { const s=extend ? rangeEnd || selected : selected; const index=visibleRows.indexOf(s.row); const next={row:dr ? visibleRows[Math.max(0,Math.min(visibleRows.length-1,(index<0?0:index)+dr))] ?? s.row:s.row,col:Math.max(0,Math.min(colCount-1,s.col+dc))}; if(extend)setRangeEnd(next);else{setSelected(next);setRangeEnd(null);} }
  function undo(redo = false) {
    const source = redo ? history.current.future : history.current.past;
    const target = redo ? history.current.past : history.current.future;
    const next = source.pop(); if (next) { target.push(structuredClone(data)); onChange(next); setEditing(false); setHistoryVersion(historyVersion + 1); }
  }
  function addSheet() {
    let n = data.sheets.length + 1; while (data.sheets.some(s => s.name === `Sheet${n}`)) n++;
    const s: Sheet = { id: crypto.randomUUID(), name: `Sheet${n}`, cells: [], rows: 40, cols: 16 };
    change({ sheets: [...data.sheets, s], activeSheet: s.id }); setActiveId(s.id); setSelected({ row: 0, col: 0 });
  }
  async function importFile(input: File) {
    setBusy(true); setMessage('');
    try {
      if (window.office?.convertImport) {
        const imported = await window.office.convertImport(input.name, Array.from(new Uint8Array(await input.arrayBuffer())), 'spreadsheet');
        if (!imported.data?.sheets?.length) throw new Error('This workbook has no worksheets.');
        change(imported.data); setActiveId(imported.data.activeSheet || imported.data.sheets[0].id); setSelected({ row: 0, col: 0 }); setFilter('');
        setMessage([`Imported ${imported.name || input.name}.`, ...(imported.warnings || [])].join(' ')); return;
      }
      const sheets: Sheet[] = [];
      if (/\.csv$/i.test(input.name)) sheets.push({ id: crypto.randomUUID(), name: 'Imported', cells: parseDelimited((await input.text()).replace(/^\uFEFF/, ''), ',') });
      else {
        const book = new ExcelJS.Workbook(); await book.xlsx.load(await input.arrayBuffer());
        book.eachSheet(ws => {
          const cells: string[][] = [];
          const styles: Record<string, CellStyle> = {};
          ws.eachRow({ includeEmpty: true }, (row, r) => {
            while (cells.length < r) cells.push([]);
            row.eachCell({ includeEmpty: true }, (cell, c) => {
              while (cells[r - 1].length < c) cells[r - 1].push('');
              const v = cell.value;
              const fill = cell.fill?.type === 'pattern' ? cell.fill.fgColor?.argb : undefined;
              styles[cell.address] = { bold: cell.font?.bold, italic: cell.font?.italic, fontFamily: cell.font?.name, fontSize: cell.font?.size, underline: !!cell.font?.underline, strike: cell.font?.strike, verticalAlign: cell.alignment?.vertical === 'top' || cell.alignment?.vertical === 'bottom' ? cell.alignment.vertical : 'middle', wrap: cell.alignment?.wrapText, indent: cell.alignment?.indent, rotation: typeof cell.alignment?.textRotation === 'number' ? cell.alignment.textRotation : undefined, borders: Object.fromEntries((['top','right','bottom','left'] as const).filter(edge => cell.border?.[edge]?.style).map(edge => [edge, `#${cell.border[edge]?.color?.argb?.slice(-6) || '243330'}`])), numberFormat: cell.numFmt, color: cell.font?.color?.argb ? `#${cell.font.color.argb.slice(-6)}` : undefined, fill: fill ? `#${fill.slice(-6)}` : undefined, align: ['left', 'center', 'right'].includes(cell.alignment?.horizontal || '') ? cell.alignment.horizontal as CellStyle['align'] : undefined };
              cells[r - 1][c - 1] = cell.type === ExcelJS.ValueType.Formula ? `=${cell.formula}` : v instanceof Date ? v.toISOString() : typeof v === 'string' ? importedText(v) : cell.text;
            });
          });
          sheets.push({ id: crypto.randomUUID(), name: ws.name, cells, styles });
        });
      }
      if (!sheets.length) throw new Error('This workbook has no worksheets.');
      change({ sheets, activeSheet: sheets[0].id }); setActiveId(sheets[0].id); setSelected({ row: 0, col: 0 });
      setMessage(`Imported ${input.name}. Values and formulas are supported; basic cell formatting is retained; charts and macros are not retained.`);
    } catch (e) { setMessage(`Import failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); if (importer.current) importer.current.value = ''; }
  }
  async function exportFile(format: 'csv' | 'xlsx') {
    exportMenu.current?.removeAttribute('open');
    setBusy(true); setMessage('');
    try {
      if (window.office?.convertExport) {
        const result = await window.office.convertExport({ ...file, data: { ...data, activeSheet: sheet.id } }, format);
        if (!result.ok && !result.cancelled) throw new Error(result.error || 'File could not be saved');
        if (!result.cancelled) setMessage(['Export complete.', ...(result.warnings || [])].join(' ')); return;
      }
      if (format === 'csv') await downloadFile(file.name, sheet.cells.map(r => r.map(csvEscape).join(',')).join('\r\n'), 'csv', 'text/csv;charset=utf-8');
      else {
        const book = new ExcelJS.Workbook();
        for (const s of data.sheets) { const ws = book.addWorksheet(s.name); s.cells.forEach((row, r) => row.forEach((v, c) => {
          const cell = ws.getCell(r + 1, c + 1);
          const input = formulaInput(v);
          if (typeof input === 'string' && input.startsWith("'")) cell.value = input.slice(1);
          else if (v.startsWith('=')) cell.value = { formula: v.slice(1) };
          else cell.value = v !== '' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/i.test(v) && v.replace(/[^0-9]/g,'').length <= 15 ? Number(v) : v;
        })); for (const [address, style] of Object.entries(s.styles || {})) { const cell = ws.getCell(address); cell.font = { bold: style.bold, italic: style.italic, name: style.fontFamily, size: style.fontSize, underline: style.underline, strike: style.strike, ...(style.color ? { color: { argb: `FF${style.color.replace('#', '')}` } } : {}) }; if (style.numberFormat) cell.numFmt = style.numberFormat; if (style.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${style.fill.replace('#', '')}` } }; cell.alignment = { horizontal: style.align, vertical: style.verticalAlign, wrapText: style.wrap, indent: style.indent, textRotation: style.rotation }; if(style.borders) cell.border = Object.fromEntries(Object.entries(style.borders).map(([edge,color])=>[edge,{style:'thin',color:{argb:`FF${color.replace('#','')}`}}])); } ws.columns.forEach(c => { c.width = 16; }); }
        book.calcProperties.fullCalcOnLoad = true;
        await downloadFile(file.name, new Uint8Array(await book.xlsx.writeBuffer()), 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } catch (e) { setMessage(`Export failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  }
  return <div className="spreadsheet-editor">
    <div className="sheet-toolbar">
      <div className="sheet-tool-group" role="group" aria-label="History"><span className="sheet-group-label">History</span><button title="Undo" disabled={!history.current.past.length} onClick={() => undo()}><Undo2 size={17}/></button><button title="Redo" disabled={!history.current.future.length} onClick={() => undo(true)}><Redo2 size={17}/></button></div>
      <div className="sheet-tool-group" role="group" aria-label="Extend worksheet"><span className="sheet-group-label">Worksheet</span><button onClick={() => updateSheet({ ...sheet, rows: rowCount + 20 })}><Plus size={15}/>20 rows</button><button onClick={() => updateSheet({ ...sheet, cols: colCount + 4 })}><Plus size={15}/>4 columns</button></div>
      <div className="sheet-tool-spacer"/><button disabled={busy} onClick={() => importer.current?.click()}><Upload size={16}/>Import</button>
      <details ref={exportMenu} className="sheet-export" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) e.currentTarget.removeAttribute("open"); }}><summary><Download size={16}/>Export<ChevronDown size={13}/></summary><div><button disabled={busy} onClick={() => exportFile('xlsx')}>Excel workbook (.xlsx)</button><button disabled={busy} onClick={() => exportFile('csv')}>Current sheet (.csv)</button></div></details>
      <input ref={importer} hidden type="file" accept=".csv,.xlsx" onChange={e => { if (e.target.files?.[0]) void importFile(e.target.files[0]); }}/>
    </div>
    <div className="sheet-command-toolbar" aria-label="Range editing commands">
      <SpreadsheetTransfer data={data} sheetId={sheet.id} range={rangeAddress} onApply={next=>{change(next);setMessage('Range copied. Undo is available.');}}/>
      <div className="sheet-command-group"><span className="sheet-group-label">Fill selection</span><button title="Copy the first row down, adjusting relative references" onClick={() => editSelection('fill', {direction:'down'})}>Fill down</button><button title="Copy the first column across, adjusting relative references" onClick={() => editSelection('fill', {direction:'right'})}>Fill right</button><button title="Copy the last row up, adjusting relative references" onClick={() => editSelection('fill', {direction:'up'})}>Fill up</button><button title="Copy the last column left, adjusting relative references" onClick={() => editSelection('fill', {direction:'left'})}>Fill left</button></div>
      <div className="sheet-command-group"><span className="sheet-group-label">Clear</span><select aria-label="Clear selected range" value="" onChange={e=>{if(e.target.value)editSelection('clear',{mode:e.target.value});}}><option value="">Choose what to clear</option><option value="contents">Contents only</option><option value="formats">Formatting only</option><option value="all">Contents and formatting</option></select></div>
      <div className="sheet-command-group sheet-sort-group"><span className="sheet-group-label">Sort selected records</span><select aria-label="Sort column" value={sortColumn} onChange={e=>setSortColumn(Number(e.target.value))}>{Array.from({length:bounds.right-bounds.left+1},(_,i)=>bounds.left+i).map(c=><option key={c} value={c}>{colName(c)}{sortHeader && sheet.cells[bounds.top]?.[c] ? ` · ${sheet.cells[bounds.top][c]}`:''}</option>)}</select><label><input type="checkbox" checked={sortHeader} onChange={e=>setSortHeader(e.target.checked)}/>Header row</label><button aria-label="Sort ascending" onClick={()=>editSelection('sort',{keyColumn:sortColumn,direction:'asc',hasHeader:sortHeader})}>A to Z</button><button aria-label="Sort descending" onClick={()=>editSelection('sort',{keyColumn:sortColumn,direction:'desc',hasHeader:sortHeader})}>Z to A</button></div>
    </div>
    <div className="sheet-format-toolbar" aria-label="Cell formatting">
      <span className="sheet-format-label">Range <strong>{rangeAddress}</strong></span><div className="sheet-format-group" role="group" aria-label="Text style">
      <button aria-label="Bold cell" aria-pressed={!!selectedStyle.bold} onClick={() => formatCell({ bold: !selectedStyle.bold })}><strong>B</strong></button>
      <button aria-label="Italic cell" aria-pressed={!!selectedStyle.italic} onClick={() => formatCell({ italic: !selectedStyle.italic })}><em>I</em></button>
      </div><div className="sheet-format-group" role="group" aria-label="Number and alignment"><select aria-label="Number format" value={selectedStyle.numberFormat || 'General'} onChange={e => formatCell({ numberFormat: e.target.value })}>{NUMBER_FORMAT_PRESETS.map(f => <option key={f}>{f}</option>)}</select>
      <select aria-label="Cell alignment" value={selectedStyle.align || ''} onChange={e => formatCell({ align: e.target.value as CellStyle['align'] })}><option value="" disabled>Auto align</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
      </div><div className="sheet-format-group" role="group" aria-label="Cell colors"><label>Text <input aria-label="Cell text color" type="color" value={selectedStyle.color || '#243330'} onChange={e => formatCell({ color: e.target.value })}/></label>
      <label>Fill <input aria-label="Cell fill color" type="color" value={selectedStyle.fill || '#ffffff'} onChange={e => formatCell({ fill: e.target.value })}/></label>
      </div><details ref={formatMenu} className="sheet-popover sheet-format-menu"><summary>Formatting<ChevronDown size={13}/></summary><div className="sheet-format-panel" role="group" aria-label="More formatting options">
        <div className="sheet-panel-heading"><strong>Format {rangeAddress}</strong><span>{mixedFormatting ? 'Mixed formatting · controls show active cell' : 'Changes apply to the selection'}</span></div>
        <fieldset><legend>Font</legend><label>Typeface<select aria-label="Font family" value={selectedStyle.fontFamily || 'Arial'} onChange={e=>formatCell({fontFamily:e.target.value})}>{['Arial','Calibri','Times New Roman','Georgia','Courier New','Segoe UI'].map(f=><option key={f}>{f}</option>)}</select></label><label>Size<input type="number" aria-label="Font size" min={6} max={96} key={`size-${rangeAddress}-${selectedStyle.fontSize}`} defaultValue={selectedStyle.fontSize || 11} onBlur={e=>{if(e.target.value !== String(selectedStyle.fontSize || 11))formatCell({fontSize:Number(e.target.value)});}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label><div className="sheet-panel-actions"><button aria-label="Decrease font size" disabled={(selectedStyle.fontSize || 11)<=6} onClick={()=>formatCell({fontSize:Math.max(6,(selectedStyle.fontSize || 11)-1)})}>A−</button><button aria-label="Increase font size" disabled={(selectedStyle.fontSize || 11)>=96} onClick={()=>formatCell({fontSize:Math.min(96,(selectedStyle.fontSize || 11)+1)})}>A+</button><button aria-label="Underline cell" aria-pressed={!!selectedStyle.underline} onClick={()=>formatCell({underline:!selectedStyle.underline})}><u>U</u></button><button aria-label="Strikethrough cell" aria-pressed={!!selectedStyle.strike} onClick={()=>formatCell({strike:!selectedStyle.strike})}><s>S</s></button></div><small>Fonts use the closest available match on this device.</small></fieldset>
        <fieldset><legend>Layout</legend><label>Vertical align<select aria-label="Vertical alignment" value={selectedStyle.verticalAlign || 'middle'} onChange={e=>formatCell({verticalAlign:e.target.value as CellStyle['verticalAlign']})}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label><label>Indent<input aria-label="Cell indent" type="number" min={0} max={15} key={`indent-${rangeAddress}-${selectedStyle.indent}`} defaultValue={selectedStyle.indent || 0} onBlur={e=>{if(e.target.value !== String(selectedStyle.indent || 0))formatCell({indent:Number(e.target.value)});}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label><label>Rotation<input aria-label="Text rotation" type="number" min={-90} max={90} key={`rotation-${rangeAddress}-${selectedStyle.rotation}`} defaultValue={selectedStyle.rotation || 0} onBlur={e=>{if(e.target.value !== String(selectedStyle.rotation || 0))formatCell({rotation:Number(e.target.value)});}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label><button aria-label="Wrap cell text" aria-pressed={!!selectedStyle.wrap} onClick={()=>formatCell({wrap:!selectedStyle.wrap})}>Wrap text</button></fieldset>
        <fieldset><legend>Borders</legend><label>Line color<input aria-label="Border color" type="color" value={borderColor} onChange={e=>setBorderColor(e.target.value)}/></label><div className="sheet-panel-actions">{(['none','all','outside','bottom'] as const).map(border=><button key={border} aria-label={`${border[0].toUpperCase()+border.slice(1)} borders`} onClick={()=>formatCell({border,borderColor})}>{border[0].toUpperCase()+border.slice(1)}</button>)}</div></fieldset>
        <fieldset><legend>Quick styles</legend><div className="sheet-panel-actions"><button onClick={()=>formatCell({bold:true,fill:'#e3eee7',color:'#204b38',border:'bottom',borderColor:'#55866b'})}>Header</button><button onClick={()=>formatCell({bold:true,numberFormat:'#,##0.00',border:'bottom',borderColor:'#243330'})}>Total</button><button onClick={()=>formatCell({fill:'#fff3c4',color:'#654f13',italic:true,wrap:true})}>Note</button><button onClick={clearFormatting}>Clear format</button></div></fieldset>
      </div></details><button onClick={clearFormatting}>Clear format</button>
      <details ref={replaceMenu} className="sheet-popover sheet-replace-menu"><summary>Find &amp; replace<ChevronDown size={13}/></summary><form className="sheet-replace-panel" onSubmit={e=>{e.preventDefault();editSelection('replace',{find:findText,replacement,matchCase,wholeCell});}}><strong>Replace in {rangeAddress}</strong><p>Searches stored values and formula text in the selected range.</p><label>Find<input aria-label="Find text" required value={findText} onChange={e=>setFindText(e.target.value)}/></label><label>Replace with<input aria-label="Replace with" value={replacement} onChange={e=>setReplacement(e.target.value)}/></label><label><input type="checkbox" checked={matchCase} onChange={e=>setMatchCase(e.target.checked)}/>Match case</label><label><input type="checkbox" checked={wholeCell} onChange={e=>setWholeCell(e.target.checked)}/>Match whole cell</label><button type="submit" disabled={!findText}>Replace in selection</button></form></details>
    </div>
    <div className="sheet-view-toolbar"><span className="sheet-view-label">View</span><input type="search" aria-label="Filter rows" placeholder="Filter rows by value or formula…" value={filter} onChange={e => setFilter(e.target.value)}/>{filter && <span>{visibleRows.length} matching rows <button onClick={() => setFilter('')}>Clear</button></span>}<label><input type="checkbox" checked={freezeFirstRow} onChange={e => setFreezeFirstRow(e.target.checked)}/>Freeze first row</label></div>
    <div className="sheet-formula"><input className="sheet-address-input" aria-label="Select cell or range" title="Enter A1:D10, or Shift-click cells" value={rangeDraft} onChange={e=>setRangeDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();selectRange();}}}/><select aria-label="Insert summary formula" value="" onChange={e=>{if(e.target.value)insertSummaryFormula(e.target.value);}}><option value="">Insert function</option>{['SUM','AVERAGE','MIN','MAX','COUNT'].map(f=><option key={f} value={f}>{f}</option>)}</select><span className="sheet-fx">ƒx</span><input aria-label="Formula bar" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') { commit(); grid.current?.focus(); } if (e.key === 'Escape') { cancelCommit.current = true; queueMicrotask(() => { cancelCommit.current = false; }); setDraft(raw); grid.current?.focus(); } }} placeholder="Enter a value or a formula, e.g. =SUM(A1:A10)"/></div>
    {(message || computed.error) && <div role="status" className="sheet-message">{message || computed.error}<button onClick={() => setMessage('')} aria-label="Dismiss message">×</button></div>}
    <div ref={grid} className="sheet-grid-scroll" tabIndex={0} aria-label="Spreadsheet grid" onPaste={e => { if (editing) return; e.preventDefault(); writeCells(parseDelimited(e.clipboardData.getData('text/plain'), '\t')); }} onCopy={e => { if (!editing) { e.preventDefault(); e.clipboardData.setData('text/plain', Array.from({length:bounds.bottom-bounds.top+1},(_,i)=>Array.from({length:bounds.right-bounds.left+1},(_,j)=>sheet.cells[bounds.top+i]?.[bounds.left+j]||'').join('\t')).join('\n')); } }} onKeyDown={e => {
      if (editing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(e.shiftKey); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); undo(true); return; }
      if ((e.ctrlKey || e.metaKey) && ['d','r'].includes(e.key.toLowerCase())) { e.preventDefault(); editSelection('fill',{direction:e.key.toLowerCase()==='d'?'down':'right'}); return; }
      const direction: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], Tab: [0, e.shiftKey ? -1 : 1], Enter: [1, 0] };
      if (direction[e.key]) { e.preventDefault(); move(...direction[e.key], e.shiftKey && e.key.startsWith('Arrow')); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); editSelection('clear',{mode:'contents'}); }
      else if (e.key === 'F2') { e.preventDefault(); setDraft(raw); setEditing(true); }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setDraft(e.key); setEditing(true); }
    }}>
      <table className={`sheet-grid ${freezeFirstRow ? 'freeze-first-row' : ''}`} role="grid"><thead><tr><th className="sheet-corner"><button aria-label="Select entire worksheet" onClick={()=>{setSelected({row:0,col:0});setRangeEnd({row:rowCount-1,col:colCount-1});grid.current?.focus();}}>▦</button></th>{Array.from({ length: colCount }, (_, c) => <th className={selected.col === c ? 'selected-heading' : ''} key={c}><button aria-label={`Select column ${colName(c)}`} onClick={()=>{setSelected({row:0,col:c});setRangeEnd({row:rowCount-1,col:c});setEditing(false);grid.current?.focus();}}>{colName(c)}</button></th>)}</tr></thead>
      <tbody>{visibleRows.map(r => <tr key={r} className={r === 0 ? 'first-data-row' : ''}><th className={selected.row === r ? 'selected-heading' : ''}><button aria-label={`Select row ${r+1}`} onClick={()=>{setSelected({row:r,col:0});setRangeEnd({row:r,col:colCount-1});setEditing(false);grid.current?.focus();}}>{r + 1}</button></th>{Array.from({ length: colCount }, (_, c) => {
        const active = selected.row === r && selected.col === c; const value = computed.values[sheet.id]?.[r]?.[c] ?? sheet.cells[r]?.[c] ?? '';
        const style = sheet.styles?.[`${colName(c)}${r + 1}`] || {};
        const display = style.numberFormat === '@' && !sheet.cells[r]?.[c]?.startsWith('=') ? (sheet.cells[r]?.[c] || '').replace(/^'/, '') : computed.numeric[sheet.id]?.[r]?.[c] ? displayValue(value, style.numberFormat) : value;
        return <td key={c} data-cell={`${colName(c)}${r + 1}`} style={{ fontWeight: style.bold ? 700 : undefined, fontStyle: style.italic ? 'italic' : undefined, backgroundColor: style.fill, color: style.color, textAlign: style.align || (style.numberFormat === '@' ? 'left' : undefined), fontFamily: style.fontFamily ? `${style.fontFamily}, sans-serif` : undefined, fontSize: style.fontSize ? `${style.fontSize}pt` : undefined, textDecoration: [style.underline ? 'underline' : '', style.strike ? 'line-through' : ''].filter(Boolean).join(' ') || undefined, verticalAlign: style.verticalAlign, whiteSpace: style.wrap ? 'normal' : undefined, paddingLeft: style.indent ? `${8 + style.indent * 12}px` : undefined, borderTop: style.borders?.top ? `1px solid ${style.borders.top}` : undefined, borderRight: style.borders?.right ? `1px solid ${style.borders.right}` : undefined, borderBottom: style.borders?.bottom ? `1px solid ${style.borders.bottom}` : undefined, borderLeft: style.borders?.left ? `1px solid ${style.borders.left}` : undefined }} aria-selected={r>=bounds.top&&r<=bounds.bottom&&c>=bounds.left&&c<=bounds.right} aria-label={`${colName(c)}${r + 1}: ${display}`} className={`${r>=bounds.top&&r<=bounds.bottom&&c>=bounds.left&&c<=bounds.right ? 'range-cell' : ''} ${active ? 'active-cell' : ''} ${value.startsWith('#') ? 'cell-error' : ''} ${value !== '' && Number.isFinite(Number(value)) ? 'cell-number' : ''}`} onClick={e => { setEditing(false); if(e.shiftKey)setRangeEnd({row:r,col:c});else{setSelected({row:r,col:c});setRangeEnd(null);} grid.current?.focus(); }} onDoubleClick={() => { setDraft(sheet.cells[r]?.[c] || ''); setEditing(true); }}>
          {active && editing ? <input autoFocus aria-label={`Edit ${colName(c)}${r + 1}`} value={draft} onClick={e => e.stopPropagation()} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit(); move(e.key === 'Enter' ? 1 : 0, e.key === 'Tab' ? (e.shiftKey ? -1 : 1) : 0); grid.current?.focus(); } if (e.key === 'Escape') { cancelCommit.current = true; queueMicrotask(() => { cancelCommit.current = false; }); setDraft(raw); setEditing(false); grid.current?.focus(); } }}/> : <span style={{ whiteSpace: style.wrap ? 'normal' : undefined, overflowWrap: style.wrap ? 'anywhere' : undefined, lineHeight: style.fontSize || style.wrap ? '1.4' : undefined, transform: style.rotation ? `rotate(${-style.rotation}deg)` : undefined, transformOrigin: 'center', minHeight: style.rotation ? `${Math.min(110, Math.abs(style.rotation) + 24)}px` : undefined }}>{display}</span>}
        </td>;
      })}</tr>)}</tbody></table>{filter && !visibleRows.length && <div className="sheet-empty-filter"><strong>No matching rows</strong><span>Try another value or clear the filter to see your worksheet.</span><button onClick={() => setFilter('')}>Clear filter</button></div>}
    </div>
    <div className="sheet-bottom"><button className="sheet-add" title="Add worksheet" onClick={addSheet}><Plus size={18}/></button><div className="sheet-tabs">{data.sheets.map(s => <button className={s.id === sheet.id ? 'current' : ''} key={s.id} onClick={() => { setActiveId(s.id); setSelected({ row: 0, col: 0 }); setEditing(false); }}>{s.name}</button>)}</div><details ref={sheetMenu} className="sheet-options" onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.removeAttribute('open');setConfirmSheetDelete(false);e.currentTarget.querySelector('summary')?.focus();}}}><summary>Sheet options<ChevronDown size={13}/></summary><div className="sheet-options-panel"><strong>{sheet.name}</strong><form onSubmit={e=>{e.preventDefault();editSelection('sheetRename',{name:sheetNameDraft});}}><label htmlFor="worksheet-name">Worksheet name</label><div><input id="worksheet-name" value={sheetNameDraft} maxLength={31} onChange={e=>setSheetNameDraft(e.target.value)}/><button type="submit">Rename</button></div></form><button onClick={()=>editSelection('sheetDuplicate')}>Duplicate worksheet</button><div className="sheet-move-actions"><button disabled={data.sheets.findIndex(s=>s.id===sheet.id)===0} onClick={()=>editSelection('sheetMove',{toIndex:data.sheets.findIndex(s=>s.id===sheet.id)-1})}>Move left</button><button disabled={data.sheets.findIndex(s=>s.id===sheet.id)===data.sheets.length-1} onClick={()=>editSelection('sheetMove',{toIndex:data.sheets.findIndex(s=>s.id===sheet.id)+1})}>Move right</button></div>{confirmSheetDelete?<div className="sheet-delete-confirm"><p>Delete {sheet.name}? You can restore it with Undo.</p><button onClick={()=>editSelection('sheetDelete')}>Confirm delete worksheet</button><button onClick={()=>setConfirmSheetDelete(false)}>Cancel</button></div>:<button className="sheet-delete-action" disabled={data.sheets.length===1} onClick={()=>setConfirmSheetDelete(true)}>Delete worksheet</button>}</div></details><span className="sheet-selection-summary" aria-live="polite">Count {selectionCount}{selectionValues.length>0 && <> · Sum {Number(selectionSum.toPrecision(12))} · Average {Number((selectionSum/selectionValues.length).toPrecision(12))}</>}</span><span className="sheet-status">{busy ? 'Working…' : raw.startsWith('=') ? `${colName(selected.col)}${selected.row + 1} = ${computed.values[sheet.id]?.[selected.row]?.[selected.col] || ''}` : 'Ready'}<span> · </span>{data.sheets.length} sheet{data.sheets.length === 1 ? '' : 's'}</span></div>
  </div>;
}


