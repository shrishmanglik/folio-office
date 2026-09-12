/**
 * Convert a raw cell to HyperFormula input without losing identifier text.
 * An existing leading apostrophe is HyperFormula's explicit text marker;
 * leave it intact so exactly one marker is removed when the cell is evaluated.
 * Ordinary numbers, decimals, formulas and error values retain their semantics.
 * @param {unknown} value
 * @returns {string | number | boolean}
 */
export function formulaInput(value) {
  if (value == null) return '';
  if (typeof value !== 'string') return value;
  if (value.startsWith("'")) return value;
  const integer = /^[+-]?(\d+)$/.exec(value);
  if (integer && ((integer[1].length > 1 && integer[1].startsWith('0')) || integer[1].length > 15)) return "'" + value;
  return value;
}
