export const NUMBER_FORMAT_PRESETS = Object.freeze(['General','0','0.00','0%','$#,##0.00','0.000','0.00%','#,##0','#,##0.00','0.00E+00','yyyy-mm-dd','@']);
const hex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
function fail(message, code = 'INVALID_ARGUMENT') { throw Object.assign(new Error(message), { code }); }
export function validateCellStyle(style) {
  if (!style || typeof style !== 'object' || Array.isArray(style) || !Object.keys(style).length) fail('style must contain at least one formatting property');
  for (const [key,value] of Object.entries(style)) {
    let valid;
    if (['bold','italic','underline','strike','wrap'].includes(key)) valid = typeof value === 'boolean';
    else if (['fill','color','borderColor'].includes(key)) valid = hex(value);
    else if (key === 'fontFamily') valid = typeof value === 'string' && value.trim().length > 0 && value.length <= 100 && !/[\x00-\x1f]/.test(value);
    else if (key === 'fontSize') valid = typeof value === 'number' && Number.isFinite(value) && value >= 6 && value <= 96;
    else if (key === 'indent') valid = Number.isInteger(value) && value >= 0 && value <= 15;
    else if (key === 'rotation') valid = Number.isInteger(value) && value >= -90 && value <= 90;
    else if (key === 'align') valid = ['left','center','right'].includes(value);
    else if (key === 'verticalAlign') valid = ['top','middle','bottom'].includes(value);
    else if (key === 'border') valid = ['none','all','outside','bottom'].includes(value);
    else if (key === 'numberFormat') valid = NUMBER_FORMAT_PRESETS.includes(value);
    else fail('Unsupported style property: ' + key);
    if (!valid) fail('Invalid style property: ' + key);
  }
  if (style.borderColor !== undefined && style.border === undefined) fail('borderColor requires a border preset');
  return structuredClone(style);
}
function point(value) {
  const match = /^([A-Z]{1,3})([1-9][0-9]{0,4})$/.exec(value || '');
  if (!match) fail('Use an A1 cell or range', 'INVALID_RANGE');
  const c = [...match[1]].reduce((n,ch) => n*26+ch.charCodeAt(0)-64,0)-1, r = Number(match[2])-1;
  if (c >= 1000 || r >= 10000) fail('Worksheet bounds are 10000 rows and 1000 columns', 'INVALID_RANGE');
  return {r,c};
}
function address(r,c) { let label=''; for(let n=c+1;n;n=Math.floor((n-1)/26)) label=String.fromCharCode(65+(n-1)%26)+label; return label+(r+1); }
export function applyCellFormatting(data, command) {
  const style = validateCellStyle(command?.style), range = command?.range;
  if (typeof range !== 'string' || range.length > 32) fail('Use an A1 range','INVALID_RANGE');
  const parts=range.split(':'); if(parts.length>2) fail('Use an A1 range','INVALID_RANGE');
  const a=point(parts[0]), b=point(parts[1] || parts[0]);
  if(b.r<a.r || b.c<a.c || (b.r-a.r+1)*(b.c-a.c+1)>10000) fail('Format up to 10000 cells in a forward rectangle','INVALID_RANGE');
  if(!Array.isArray(data?.sheets) || !data.sheets.length) fail('Workbook requires sheets');
  const id=command.sheetId ?? data.activeSheet ?? data.sheets[0].id;
  if(!data.sheets.some(s=>s.id===id)) fail('Sheet ID was not found','NOT_FOUND');
  const out=structuredClone(data), sheet=out.sheets.find(s=>s.id===id); sheet.styles ??= {};
  const {border,borderColor,...scalar}=style;
  for(let r=a.r;r<=b.r;r++) for(let c=a.c;c<=b.c;c++) {
    const key=address(r,c), next={...sheet.styles[key],...scalar};
    if(border !== undefined) {
      next.borders={}; const color=borderColor || '#64748b';
      for(const edge of ['top','right','bottom','left']) if(border==='all' || (border==='bottom' && edge==='bottom' && r===b.r) || (border==='outside' && ((edge==='top'&&r===a.r)||(edge==='bottom'&&r===b.r)||(edge==='left'&&c===a.c)||(edge==='right'&&c===b.c)))) next.borders[edge]=color;
      delete next.border; delete next.borderColor;
    }
    sheet.styles[key]=next;
  }
  return out;
}
