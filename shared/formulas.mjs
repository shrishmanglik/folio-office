import FormulaParser from 'fast-formula-parser';

const { FormulaError } = FormulaParser;

/** A read-only workbook calculator shared by the editor, CLI and XLSX export.
 * Input has already passed through formulaInput, including explicit text markers.
 * Each recursion depth has its own parser: the upstream parser is stateful.
 */
export class FormulaEngine {
  static buildFromSheets(sheets) { return new FormulaEngine(sheets); }
  static buildFromArray(cells) { return new FormulaEngine({ Sheet1: cells }); }
  constructor(sheets) {
    this.names = Object.keys(sheets);
    this.sheets = sheets;
    this.cache = new Map();
    this.active = new Set();
    this.parsers = [];
    this.depth = 0;
  }
  getSheetId(name) { const id = this.names.findIndex(n => n.toLowerCase() === name.toLowerCase()); return id < 0 ? undefined : id; }
  reference({ sheet, row, col }) {
    const id = this.getSheetId(sheet);
    if (id === undefined) return FormulaError.REF;
    return this.evaluate(id, row - 1, col - 1) ?? 0;
  }
  parser(depth) {
    return this.parsers[depth] ||= new FormulaParser({
      // Offline workbooks must never fetch external data.
      functions: { WEBSERVICE: () => FormulaError.NAME },
      onCell: ref => this.reference(ref),
      onRange: ref => {
        const id = this.getSheetId(ref.sheet);
        if (id === undefined) return [[FormulaError.REF]];
        const cells = this.sheets[this.names[id]];
        const endRow = ref.to.row === FormulaParser.MAX_ROW ? Math.max(ref.from.row, cells.length) : ref.to.row;
        const endCol = ref.to.col === FormulaParser.MAX_COLUMN ? Math.max(ref.from.col, ...cells.map(r => r.length)) : ref.to.col;
        if ((endRow - ref.from.row + 1) * (endCol - ref.from.col + 1) > 1000000) return [[FormulaError.NUM]];
        return Array.from({ length: endRow - ref.from.row + 1 }, (_, r) =>
          Array.from({ length: endCol - ref.from.col + 1 }, (_, c) =>
            this.reference({ sheet: ref.sheet, row: ref.from.row + r, col: ref.from.col + c })));
      },
    });
  }
  evaluate(sheet, row, col) {
    const key = `${sheet}:${row}:${col}`;
    if (this.cache.has(key)) return this.cache.get(key);
    if (this.active.has(key)) return new FormulaError('#CYCLE!');
    if (this.depth >= 256) return FormulaError.NUM;
    const name = this.names[sheet];
    if (name === undefined) return FormulaError.REF;
    const raw = this.sheets[name][row]?.[col];
    let value = raw == null || raw === '' ? null : raw;
    if (typeof raw === 'string') {
      if (raw.startsWith("'")) value = raw.slice(1);
      else if (raw.startsWith('=')) {
        this.active.add(key);
        const depth = this.depth++;
        try { value = this.parser(depth).parse(raw.slice(1), { sheet: name, row: row + 1, col: col + 1 }); }
        catch (error) { value = error instanceof FormulaError ? error : FormulaError.VALUE; }
        finally { this.depth--; this.active.delete(key); }
      } else if (/^(TRUE|FALSE)$/i.test(raw)) value = raw.toUpperCase() === 'TRUE';
      else if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim())) value = Number(raw);
      else if (/^#(?:DIV\/0!|N\/A|NAME\?|NULL!|NUM!|REF!|VALUE!|ERROR!)$/.test(raw)) value = new FormulaError(raw);
    }
    this.cache.set(key, value);
    return value;
  }
  getCellValue({ sheet, row, col }) {
    const result = this.evaluate(sheet, row, col);
    return result instanceof FormulaError ? { value: result.error } : result;
  }
  destroy() { this.cache.clear(); this.active.clear(); this.parsers.length = 0; }
}
