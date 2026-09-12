const test=require('node:test'); const assert=require('node:assert/strict');
test('shared formula engine handles financial, lookup, logical and cross-sheet calculations',async()=>{
 const {FormulaEngine}=await import('../shared/formulas.mjs');
 const e=FormulaEngine.buildFromSheets({'Sales data':[['Item','Value'],['A',10],['B',20]], Summary:[['=SUM(\'Sales data\'!B2:B3)','=AVERAGE(\'Sales data\'!B2:B3)','=IF(A1>20,"yes","no")','=VLOOKUP("B",\'Sales data\'!A2:B3,2,FALSE)','=COUNT(\'Sales data\'!B:B)'],['=A1*2','=SUM(A1,A2)','=1/0','=Missing!A1','=WEBSERVICE("https://example.com")']]});
 try{const cell=(row,col)=>e.getCellValue({sheet:1,row,col}); assert.deepEqual([0,1,2,3,4].map(c=>cell(0,c)),[30,15,'yes',20,2]);assert.equal(cell(1,0),60);assert.equal(cell(1,1),90);assert.equal(cell(1,2).value,'#DIV/0!');assert.equal(cell(1,3).value,'#REF!');assert.equal(cell(1,4).value,'#NAME?');}finally{e.destroy();}
});
test('circular references return an error without hanging or contaminating other cells',async()=>{
 const {FormulaEngine}=await import('../shared/formulas.mjs');const e=FormulaEngine.buildFromArray([['=B1','=A1','=SUM(2,3)']]);try{assert.match(e.getCellValue({sheet:0,row:0,col:0}).value,/^#/);assert.equal(e.getCellValue({sheet:0,row:0,col:2}),5);}finally{e.destroy();}
});
