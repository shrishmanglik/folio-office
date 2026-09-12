'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {exportFile,importFile}=require('../core/formats.cjs');
test('XLSX roundtrip retains all new font, alignment and physical border styles including blank cells',async()=>{
 const {applyCellFormatting}=await import('../shared/cell-styles.mjs');const dir=await fs.mkdtemp(path.join(os.tmpdir(),'folio-styles-'));
 try {const data=applyCellFormatting({sheets:[{id:'s',name:'Styles',cells:[['12.5']]}]},{range:'A1:B2',style:{bold:true,italic:true,fontFamily:'Arial',fontSize:19,underline:true,strike:true,color:'#112233',fill:'#FFEEDD',numberFormat:'0.000',align:'right',verticalAlign:'middle',wrap:true,indent:2,rotation:-45,border:'outside',borderColor:'#ABCDEF'}});
 const dest=path.join(dir,'styles.xlsx');await exportFile({kind:'spreadsheet',data},'xlsx',dest);
 const ExcelJS=require('exceljs'),book=new ExcelJS.Workbook();await book.xlsx.readFile(dest);const actual=book.worksheets[0].getCell('B2');assert.equal(actual.font.name,'Arial');assert.equal(actual.alignment.textRotation,-45);assert.equal(actual.border.bottom.color.argb,'FFABCDEF');assert.equal(actual.border.left,undefined);
 const imported=await importFile(dest,'spreadsheet');for(const key of ['A1','A2','B1','B2'])assert.deepEqual(imported.data.sheets[0].styles[key],data.sheets[0].styles[key]);assert.equal(imported.data.sheets[0].cells[0][0],'12.5');
 } finally {await fs.rm(dir,{recursive:true,force:true});}
});
test('XLSX preserves copied formula results as explicit text instead of evaluating or coercing them',async()=>{
 const {applySpreadsheetCommand}=await import('../shared/spreadsheet-operations.mjs'),{FormulaEngine}=await import('../shared/formulas.mjs'),{formulaInput}=await import('../shared/cells.mjs');
 const texts=['=1+1','1.20','TRUE',"'hello",'#N/A','00123','12345678901234567890','ordinary label'];
 const source={activeSheet:'s',sheets:[{id:'s',name:'Text',cells:[texts.map(v=>'="'+v.replaceAll('"','""')+'"')]}]};
 const copied=applySpreadsheetCommand(source,{sheetId:'s',action:'copyRange',range:'A1:H1',target:'A2',mode:'values'});
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'folio-text-xlsx-'));
 try {const dest=path.join(dir,'strings.xlsx');await exportFile({kind:'spreadsheet',data:copied},'xlsx',dest);const ExcelJS=require('exceljs'),physical=new ExcelJS.Workbook();await physical.xlsx.readFile(dest);
 texts.forEach((value,i)=>{assert.equal(physical.worksheets[0].getCell(2,i+1).type,ExcelJS.ValueType.String);assert.equal(physical.worksheets[0].getCell(2,i+1).value,value);});
 const imported=await importFile(dest,'spreadsheet'),cells=imported.data.sheets[0].cells;const engine=FormulaEngine.buildFromArray(cells.map(row=>row.map(formulaInput)));
 texts.forEach((value,col)=>assert.equal(engine.getCellValue({sheet:0,row:1,col}),value));assert.equal(cells[1][7],'ordinary label');assert.ok(cells[0][0].startsWith('='));engine.destroy();
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
