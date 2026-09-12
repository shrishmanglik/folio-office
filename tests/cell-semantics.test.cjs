const test = require('node:test');
const assert = require('node:assert/strict');


test('identifier and explicit text semantics survive real formula evaluation', async () => {
  const { FormulaEngine } = await import('../shared/formulas.mjs');
  const { formulaInput } = await import('../shared/cells.mjs');
  const raw = ['000042', '12345678901234567', "'00123", "'=1+1", "''hello", '42', '0.42', '=SUM(F1:G1)', '=1/0', '-00123'];
  const engine = FormulaEngine.buildFromArray([raw.map(formulaInput)]);
  try {
    const actual = raw.map((_, col) => engine.getCellValue({ sheet: 0, row: 0, col }));
    assert.deepEqual(actual.slice(0, 8), ['000042', '12345678901234567', '00123', '=1+1', "'hello", 42, 0.42, 42.42]);
    assert.equal(actual[8].value, '#DIV/0!');
    assert.equal(actual[9], '-00123');
  } finally { engine.destroy(); }
});
