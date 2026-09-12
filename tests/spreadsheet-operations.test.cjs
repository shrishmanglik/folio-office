const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const moduleReady = import('../shared/spreadsheet-operations.mjs');
const workbook = () => ({activeSheet:'s1',sheets:[{id:'s1',name:'Data',rows:10,cols:5,cells:[['Name','Value'],['Bravo','20'],['Alpha','3']],styles:{A2:{bold:true},B3:{fill:'#ff0000'}}},{id:'s2',name:'Other',cells:[['=Data!B2', '="Data!B2"']]}]});
test('clear preserves contents or formats according to mode and never mutates input',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady; const data=workbook(), before=structuredClone(data);
 const formats=edit(data,{action:'clear',sheetId:'s1',range:'A2:B3',mode:'formats'}); assert.deepEqual(formats.sheets[0].cells,data.sheets[0].cells);assert.deepEqual(formats.sheets[0].styles,{});
 const contents=edit(data,{action:'clear',range:'A2:B3',mode:'contents'});assert.equal(contents.sheets[0].cells[1][0],'');assert.deepEqual(contents.sheets[0].styles,data.sheets[0].styles);assert.deepEqual(data,before);
 assert.throws(()=>edit(data,{action:'clear',range:'B3:A2',mode:'all'}),{code:'INVALID_INPUT'});
 assert.throws(()=>edit(data,{action:'clear',range:'A1:ZZ100',mode:'all'}),{code:'INVALID_INPUT'});
});
test('fill translates relative absolute and mixed references while preserving strings and sheet names',async()=>{
 const {applySpreadsheetCommand:edit,translateFormula}=await moduleReady;
 assert.equal(translateFormula('=A1+$B1+C$1+$D$1+SUM(A1:B2)+"A1"+\'Q1\'!A1+LOG10(A1)',1,2),'=C2+$B2+E$1+$D$1+SUM(C2:D3)+"A1"+\'Q1\'!C2+LOG10(C2)');
 assert.equal(translateFormula('=A1!B2+"say ""A1"""',1,1),'=A1!C3+"say ""A1"""');
 const data=workbook();data.sheets[0].cells=[['=B1+$C$2','7']];data.sheets[0].styles={A1:{bold:true}};
 const out=edit(data,{action:'fill',range:'A1:A3',direction:'down'});assert.equal(out.sheets[0].cells[2][0],'=B3+$C$2');assert.deepEqual(out.sheets[0].styles.A3,{bold:true});
 const right=edit(data,{action:'fill',range:'A1:C1',direction:'right'});assert.equal(right.sheets[0].cells[0][2],'=D1+$C$2');
 for(const source of ['=SUM(A:A)','=SUM(1:2)','=SUM(S1:S3!A1)','=[Other]Sheet!A1','=ALL10000']) assert.throws(()=>translateFormula(source,1,1),{code:'UNSUPPORTED_OPERATION'});
});
test('sort moves rectangular records and formatting together and preserves headers and outside cells',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady;const data=workbook();data.sheets[0].cells[1][2]='outside';
 const out=edit(data,{action:'sort',range:'A1:B3',keyColumn:1,direction:'asc',hasHeader:true});assert.deepEqual(out.sheets[0].cells,[['Name','Value'],['Alpha','3','outside'],['Bravo','20']]);assert.deepEqual(out.sheets[0].styles.B2,{fill:'#ff0000'});assert.deepEqual(out.sheets[0].styles.A3,{bold:true});assert.equal(out.sheets[0].styles.A2,undefined);
 data.sheets[0].cells[2][1]='=1+2';assert.throws(()=>edit(data,{action:'sort',range:'A1:B3',keyColumn:1,direction:'asc',hasHeader:true}),{code:'UNSUPPORTED_OPERATION'});
});
test('sheet rename updates cross-sheet references but not string literals; deletion fails closed',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady;const data=workbook();
 const out=edit(data,{action:'sheetRename',sheetId:'s1',name:"O'Brien Data"});assert.equal(out.sheets[1].cells[0][0],"='O''Brien Data'!B2");assert.equal(out.sheets[1].cells[0][1],'="Data!B2"');
 const again=edit(out,{action:'sheetRename',sheetId:'s1',name:'New'});assert.equal(again.sheets[1].cells[0][0],"='New'!B2");
 assert.throws(()=>edit(data,{action:'sheetDelete',sheetId:'s1'}),{code:'UNSUPPORTED_OPERATION'});
 assert.throws(()=>edit(data,{action:'sheetRename',name:'other'}),{code:'INVALID_INPUT'});
 const deleted=edit(data,{action:'sheetDelete',sheetId:'s2'});assert.equal(deleted.sheets.length,1);assert.throws(()=>edit(deleted,{action:'sheetDelete'}),{code:'INVALID_INPUT'});
});
test('duplicate clones styles and self references and move preserves stable identities',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady;const data=workbook();data.sheets[0].cells[0][0]='=Data!B2';
 const out=edit(data,{action:'sheetDuplicate'});assert.equal(out.sheets.length,3);assert.equal(out.sheets[1].name,'Data (2)');assert.equal(out.sheets[1].cells[0][0],"='Data (2)'!B2");assert.notEqual(out.sheets[1].id,'s1');out.sheets[1].styles.A2.bold=false;assert.equal(data.sheets[0].styles.A2.bold,true);
 const moved=edit(data,{action:'sheetMove',sheetId:'s1',toIndex:1});assert.deepEqual(moved.sheets.map(s=>s.id),['s2','s1']);assert.equal(moved.activeSheet,'s1');
 assert.throws(()=>edit(data,{action:'sheetMove',toIndex:2}),{code:'INVALID_INPUT'});
});
test('engine edit shares command behavior, revision guard, dry run and replay receipts',async t=>{
 const {createEngine}=require('../core/engine.cjs');const dir=await fs.mkdtemp(path.join(os.tmpdir(),'folio-sheet-edit-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const engine=createEngine(dir);
 const created=await engine.execute({operation:'file.create',kind:'spreadsheet',name:'Book',data:workbook(),requestId:'create'});
 const cmd={operation:'spreadsheet.edit',fileId:created.file.id,expectedRevision:created.file.revision,requestId:'sort',action:'sort',sheetId:'s1',range:'A1:B3',keyColumn:1,direction:'asc',hasHeader:true};
 const before=await fs.readFile(path.join(dir,'workspace.state.json'));await engine.execute({...cmd,requestId:'preview',dryRun:true});assert.deepEqual(await fs.readFile(path.join(dir,'workspace.state.json')),before);
 const result=await engine.execute(cmd);assert.equal(result.file.data.sheets[0].cells[1][0],'Alpha');assert.equal((await engine.execute(cmd)).replayed,true);
 await assert.rejects(engine.execute({...cmd,requestId:'stale'}),{code:'REVISION_CONFLICT'});
 const after=await fs.readFile(path.join(dir,'workspace.state.json'));await assert.rejects(engine.execute({...cmd,requestId:'invalid',expectedRevision:result.file.revision,range:'Z1:A1'}),{code:'INVALID_INPUT'});assert.deepEqual(await fs.readFile(path.join(dir,'workspace.state.json')),after);
});
test('double quotes inside sheet identifiers are not formula string delimiters',async()=>{
 const {applySpreadsheetCommand:edit,translateFormula}=await moduleReady;
 const ref = "='A\"B'!A1&\"text\"";
 assert.equal(translateFormula(ref,1,0),"='A\"B'!A2&\"text\"");
 const data={activeSheet:'a',sheets:[{id:'a',name:'A"B',cells:[['1']]},{id:'b',name:'Other',cells:[[ref]]}]};
 assert.equal(edit(data,{action:'sheetRename',name:'New'}).sheets[1].cells[0][0],"='New'!A1&\"text\"");
 assert.throws(()=>edit(data,{action:'sheetDelete'}),{code:'UNSUPPORTED_OPERATION'});
 data.sheets[1].cells[0][0]='=INDIRECT("A1")';assert.throws(()=>edit(data,{action:'sheetRename',name:'New'}),{code:'UNSUPPORTED_OPERATION'});
});

test('referenced sheet cannot bypass deletion using the previous internal marker as its name', async () => {
 const {applySpreadsheetCommand}=await import('../shared/spreadsheet-operations.mjs');
 const data={activeSheet:'s',sheets:[{id:'s',name:'__deleted_sheet__',cells:[['42']]},{id:'t',name:'Other',cells:[["='__deleted_sheet__'!A1"]]}]};
 assert.throws(()=>applySpreadsheetCommand(data,{action:'sheetDelete',sheetId:'s'}),/referenced/);
 assert.equal(data.sheets.length,2);
});


test('fill up and left use bottom and right sources with atomic negative-reference refusal',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady;
 const data={activeSheet:'s',sheets:[{id:'s',name:'Data',cells:[['','','=A3+$C$1'],[],['=B3+$C$1']],styles:{A3:{italic:true}}}]};
 const up=edit(data,{action:'fill',range:'A1:A3',direction:'up'});
 assert.equal(up.sheets[0].cells[0][0],'=B1+$C$1');assert.deepEqual(up.sheets[0].styles.A1,{italic:true});
 data.sheets[0].cells[0][2]='=C3+$A$1';
 const left=edit(data,{action:'fill',range:'A1:C1',direction:'left'});assert.equal(left.sheets[0].cells[0][0],'=A3+$A$1');
 data.sheets[0].cells[0][2]='=A1';const before=structuredClone(data);
 assert.throws(()=>edit(data,{action:'fill',range:'A1:C1',direction:'left'}),{code:'UNSUPPORTED_OPERATION'});assert.deepEqual(data,before);
});
test('replace is literal, bounded, case-selectable and preserves style and outside cells',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady;
 const data={activeSheet:'s',sheets:[{id:'s',name:'Data',cells:[['A.b a.B','a.b','outside'],['A.B',42]],styles:{A1:{bold:true}}}]};
 const out=edit(data,{action:'replace',range:'A1:B2',find:'a.b',replacement:'$&'});
 assert.deepEqual(out.sheets[0].cells,[['$& $&','$&','outside'],['$&',42]]);assert.deepEqual(out.sheets[0].styles,data.sheets[0].styles);
 const whole=edit(data,{action:'replace',range:'A1:B2',find:'a.b',replacement:'',wholeCell:true,matchCase:true});
 assert.deepEqual(whole.sheets[0].cells,[['A.b a.B','','outside'],['A.B',42]]);
 assert.throws(()=>edit(data,{action:'replace',range:'A1:B2',find:'',replacement:'x'}),{code:'INVALID_INPUT'});
 for(const literal of ['[x]','a+b','(x)','^x$','a\\b','x?']) {data.sheets[0].cells[0][0]=literal;assert.equal(edit(data,{action:'replace',range:'A1',find:literal,replacement:'ok'}).sheets[0].cells[0][0],'ok');}
});


test('copy range snapshots overlaps, translates formulas and supports value freezing and format-only transfer',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady;
 const data={activeSheet:'s',sheets:[{id:'s',name:'Data',cells:[['5','=A1*2'],['7','=A2*2']],styles:{B1:{bold:true}}},{id:'t',name:'Target',cells:[['99','old']],styles:{A1:{italic:true}}}]};
 const overlap=edit(data,{action:'copyRange',range:'A1:B2',target:'B1',mode:'all'});
 assert.deepEqual(overlap.sheets[0].cells,[['5','5','=B1*2'],['7','7','=B2*2']]);assert.deepEqual(overlap.sheets[0].styles.C1,{bold:true});
 const values=edit(data,{action:'copyRange',range:'A1:B2',target:'A1',targetSheetId:'t',mode:'values',transpose:true});
 assert.deepEqual(values.sheets[1].cells,[['5','7'],['10','14']]);assert.deepEqual(values.sheets[1].styles.A1,{italic:true});
 const formats=edit(data,{action:'copyRange',range:'B1',target:'A1',targetSheetId:'t',mode:'formats'});assert.equal(formats.sheets[1].cells[0][0],'99');assert.deepEqual(formats.sheets[1].styles.A1,{bold:true});
 assert.deepEqual(data.sheets[0].cells,[['5','=A1*2'],['7','=A2*2']]);
});
test('copy range skips blanks, validates destination bounds and rejects unsafe copies without mutation',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady;const data=workbook();data.sheets[0].cells=[['','keep'],['destination','before']];
 const out=edit(data,{action:'copyRange',range:'A1:B1',target:'A2',mode:'all',skipBlanks:true});assert.deepEqual(out.sheets[0].cells[1],['destination','keep']);
 assert.throws(()=>edit(data,{action:'copyRange',range:'A1:B1',target:'ALL10000',mode:'all'}));
 data.sheets[0].cells[0][1]='=A1';const before=structuredClone(data);assert.throws(()=>edit(data,{action:'copyRange',range:'B1',target:'A1',mode:'all'}),{code:'UNSUPPORTED_OPERATION'});assert.deepEqual(data,before);
});


test('values-only copy preserves formula text results as text rather than executable formulas or coerced scalars',async()=>{
 const {applySpreadsheetCommand:edit}=await moduleReady;const {FormulaEngine}=await import('../shared/formulas.mjs');
 const strings=['=1+1','1.20','TRUE',"'hello",'#N/A'];
 const data={sheets:[{id:'s',name:'Data',cells:strings.map(v=>['="'+v.replaceAll('"','""')+'"'])}]};
 const out=edit(data,{action:'copyRange',sheetId:'s',range:'A1:A5',target:'B1',mode:'values'});
 const calc=FormulaEngine.buildFromSheets({Data:out.sheets[0].cells});
 try{strings.forEach((v,r)=>assert.equal(calc.getCellValue({sheet:0,row:r,col:1}),v));}finally{calc.destroy();}
});
