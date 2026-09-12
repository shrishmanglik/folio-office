'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fixture=()=>({activeSheet:'s',sheets:[{id:'s',name:'Sheet1',cells:[['1','2'],['3','4']],styles:{A1:{bold:true,color:'#123456'}}},{id:'other',name:'Other',cells:[['keep']]}]});
test('formatting clones source, preserves values and existing scalar style, and bounds outside border to perimeter',async()=>{
 const {applyCellFormatting}=await import('../shared/cell-styles.mjs');const source=fixture(),before=structuredClone(source);
 const result=applyCellFormatting(source,{range:'A1:B2',style:{fontSize:18,border:'outside',borderColor:'#ABCDEF'}});
 assert.deepEqual(source,before);assert.notEqual(result.sheets[1],source.sheets[1]);assert.deepEqual(result.sheets[0].cells,source.sheets[0].cells);
 assert.deepEqual(result.sheets[0].styles.A1,{bold:true,color:'#123456',fontSize:18,borders:{top:'#ABCDEF',left:'#ABCDEF'}});
 assert.deepEqual(result.sheets[0].styles.B2.borders,{right:'#ABCDEF',bottom:'#ABCDEF'});
 const cleared=applyCellFormatting(result,{range:'A1',style:{border:'none',bold:false}});assert.deepEqual(cleared.sheets[0].styles.A1.borders,{});assert.equal(cleared.sheets[0].styles.A1.bold,false);
});
test('reject invalid styles, unknown keys and invalid ranges without changing source',async()=>{
 const {applyCellFormatting,validateCellStyle}=await import('../shared/cell-styles.mjs');const source=fixture(),before=structuredClone(source);
 for(const style of [{},{bold:1},{fontSize:NaN},{fontSize:97},{fontFamily:''},{fontFamily:'x'.repeat(101)},{rotation:91},{rotation:1.5},{indent:-1},{wrap:'yes'},{border:'dashed'},{borderColor:'#abcdef'},{numberFormat:'evil'},{unknown:true},{color:'red'}])assert.throws(()=>validateCellStyle(style),{code:'INVALID_ARGUMENT'});
 for(const range of ['B2:A1','A1:A10001','A1:B10000','ALM1','A0','A1:B2:C3'])assert.throws(()=>applyCellFormatting(source,{range,style:{bold:true}}),{code:'INVALID_RANGE'});
 assert.throws(()=>applyCellFormatting(source,{sheetId:'missing',range:'A1',style:{bold:true}}),{code:'NOT_FOUND'});assert.deepEqual(source,before);
});
test('all supported presets and formatting properties validate',async()=>{const {validateCellStyle,NUMBER_FORMAT_PRESETS}=await import('../shared/cell-styles.mjs');for(const numberFormat of NUMBER_FORMAT_PRESETS)assert.doesNotThrow(()=>validateCellStyle({numberFormat}));assert.doesNotThrow(()=>validateCellStyle({fontFamily:'Arial',fontSize:6,underline:false,strike:true,verticalAlign:'middle',wrap:true,indent:15,rotation:-90,border:'all'}));});
test('engine formatting rejects atomically and supports dry-run, idempotency and stale revision checks',async()=>{
 const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createEngine}=require('../core/engine.cjs');const dir=await fs.mkdtemp(path.join(os.tmpdir(),'folio-style-engine-'));
 try {const engine=createEngine(dir),created=await engine.execute({operation:'file.create',kind:'spreadsheet',name:'Formatting',requestId:'create'});const command={operation:'spreadsheet.format',fileId:created.file.id,expectedRevision:created.file.revision,requestId:'style',range:'A1:B2',style:{fontFamily:'Arial',fontSize:22,wrap:true,border:'outside'}};const before=await fs.readFile(path.join(dir,'workspace.state.json'));
 await assert.rejects(engine.execute({...command,style:{fontSize:200}}),{code:'INVALID_ARGUMENT'});assert.deepEqual(await fs.readFile(path.join(dir,'workspace.state.json')),before);
 await engine.execute({...command,dryRun:true});assert.deepEqual(await fs.readFile(path.join(dir,'workspace.state.json')),before);
 const applied=await engine.execute(command);assert.notEqual(applied.file.revision,created.file.revision);assert.equal((await engine.execute(command)).replayed,true);
 await assert.rejects(engine.execute({...command,requestId:'stale'}),{code:'REVISION_CONFLICT'});const snapshot=await engine.snapshot();assert.equal(snapshot[0].data.sheets[0].styles.A1.fontSize,22);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
