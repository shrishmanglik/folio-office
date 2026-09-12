const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createEngine}=require('../core/engine.cjs');
const {validateCommand}=require('../agent/tool-definitions.cjs');
async function setup(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'office-history-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return{dir,engine:createEngine(dir)};}
const create=engine=>engine.execute({operation:'file.create',kind:'document',name:'Original',data:{content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Hello world',marks:[{type:'bold'}]},{type:'text',text:' again',marks:[{type:'italic'}]}]}]}},requestId:'create'});
test('human and agent history survives restart, restores content/name, rejects stale writes and replays retries',async t=>{
 const {dir,engine}=await setup(t);const original=(await create(engine)).file;
 const base=await engine.snapshot(),human=structuredClone(base);human[0].name='Human name';human[0].data.content.content[0].content[0].text='Human text';const humanSaved=(await engine.saveSnapshot(human,base))[0];
 const agent=(await engine.execute({operation:'document.append',fileId:original.id,expectedRevision:humanSaved.revision,text:'Agent text',requestId:'append'})).file;
 const restarted=createEngine(dir);const history=await restarted.execute({operation:'file.history',fileId:original.id});assert.equal(history.revisions.length,3);assert.ok(history.revisions.some(h=>h.origin==='human:ui.save'));assert.ok(history.revisions.every(h=>!h.snapshot&&!h.data));
 const restore={operation:'file.restore',fileId:original.id,expectedRevision:agent.revision,targetRevision:original.revision,requestId:'restore'};
 await assert.rejects(restarted.execute({...restore,expectedRevision:humanSaved.revision}),e=>e.code==='REVISION_CONFLICT');
 const before=await fs.readFile(path.join(dir,'workspace.state.json'));await restarted.execute({...restore,dryRun:true});assert.deepEqual(await fs.readFile(path.join(dir,'workspace.state.json')),before);
 const restored=await restarted.execute(restore);assert.equal(restored.file.name,'Original');assert.deepEqual(restored.file.data,original.data);assert.equal((await createEngine(dir).execute(restore)).replayed,true);
 assert.ok((await restarted.execute({operation:'file.history',fileId:original.id})).revisions.some(h=>h.revision===agent.revision));
});
test('literal replacement preserves existing marks and formatting addresses typed nodes',async t=>{
 const {engine}=await setup(t);let file=(await create(engine)).file;
 file=(await engine.execute(validateCommand({operation:'document.replaceText',fileId:file.id,expectedRevision:file.revision,requestId:'replace',find:'world',replacement:'team'}))).file;
 assert.equal(file.data.content.content[0].content[0].text,'Hello team');assert.deepEqual(file.data.content.content[0].content[0].marks,[{type:'bold'}]);assert.deepEqual(file.data.content.content[0].content[1].marks,[{type:'italic'}]);
 file=(await engine.execute(validateCommand({operation:'document.format',fileId:file.id,expectedRevision:file.revision,requestId:'format',nodePath:[0],heading:2,alignment:'center',marks:[{type:'underline'}]}))).file;
 assert.equal(file.data.content.content[0].type,'heading');assert.deepEqual(file.data.content.content[0].attrs,{level:2,textAlign:'center'});assert.deepEqual(file.data.content.content[0].content[1].marks,[{type:'underline'}]);
 await assert.rejects(engine.execute({operation:'document.format',fileId:file.id,expectedRevision:file.revision,requestId:'bad',nodePath:[0,0],alignment:'right'}),e=>e.code==='INVALID_ARGUMENT');
 await assert.rejects(engine.execute({operation:'document.format',fileId:file.id,expectedRevision:file.revision,requestId:'bad-mark',nodePath:[0],marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}),e=>e.code==='INVALID_ARGUMENT');
 const clean=(await engine.execute({operation:'document.replaceText',fileId:file.id,expectedRevision:file.revision,requestId:'empty',nodePath:[0,0],find:'Hello team',replacement:''})).file;assert.equal(clean.data.content.content[0].content.length,1);
});
test('per-file history keeps only newest thirty versions and pruned restore fails',async t=>{
 const {engine}=await setup(t);const original=(await create(engine)).file;let file=original;for(let i=0;i<32;i++)file=(await engine.execute({operation:'file.update',fileId:file.id,expectedRevision:file.revision,requestId:'rename-'+i,name:'Name '+i})).file;
 const history=await engine.execute({operation:'file.history',fileId:file.id});assert.equal(history.revisions.length,30);assert.equal(history.revisions[0].revision,file.revision);assert.ok(!history.revisions.some(h=>h.revision===original.revision));await assert.rejects(engine.execute({operation:'file.restore',fileId:file.id,expectedRevision:file.revision,requestId:'pruned',targetRevision:original.revision}),e=>e.code==='NOT_FOUND');
});
test('spreadsheet formatting validates ranges and preserves scalar/formula data',async t=>{
 const {engine}=await setup(t);let file=(await engine.execute({operation:'file.create',kind:'spreadsheet',name:'Numbers',requestId:'create'})).file;
 file=(await engine.execute({operation:'spreadsheet.write',fileId:file.id,expectedRevision:file.revision,requestId:'write',start:'A1',values:[[1,'=A1*2']]})).file;
 const originalCells=structuredClone(file.data.sheets[0].cells);file=(await engine.execute(validateCommand({operation:'spreadsheet.format',fileId:file.id,expectedRevision:file.revision,requestId:'style',range:'A1:B2',style:{bold:true,numberFormat:'0.00',fill:'#ffeeaa'}}))).file;
 assert.deepEqual(file.data.sheets[0].cells,originalCells);assert.deepEqual(file.data.sheets[0].styles.B2,{bold:true,numberFormat:'0.00',fill:'#ffeeaa'});
 for(const [range,style] of [['A1:B10000',{bold:true}],['A1',{fill:'url(x)'}],['A1',{bold:'yes'}],['A1',{unsafe:true}]])await assert.rejects(engine.execute({operation:'spreadsheet.format',fileId:file.id,expectedRevision:file.revision,requestId:'bad',range,style}));
});
test('global history cap prunes oldest snapshots across files',async t=>{
 const {dir,engine}=await setup(t);const file=(await create(engine)).file;const statePath=path.join(dir,'workspace.state.json'),state=JSON.parse(await fs.readFile(statePath,'utf8'));
 // Seed a valid older state near the cap without generating huge recovery receipts.
 const text='x'.repeat(900000);state.history=Array.from({length:24},(_,i)=>({fileId:'older-'+i,revision:'older-revision-'+i,at:'2026-01-01T00:00:00.000Z',origin:'human:ui.save',snapshot:{id:'older-'+i,kind:'notebook',name:'Older '+i,updatedAt:'2026-01-01T00:00:00.000Z',data:{pages:[{id:'p',title:'Page',text}]}}}));await fs.writeFile(statePath,JSON.stringify(state));
 await engine.execute({operation:'file.update',fileId:file.id,expectedRevision:file.revision,requestId:'cap',name:'New revision'});
 const after=JSON.parse(await fs.readFile(statePath,'utf8'));assert.ok(Buffer.byteLength(JSON.stringify(after.history))<=20*1024*1024);assert.ok(!after.history.some(h=>h.fileId==='older-0'));assert.ok(after.history.some(h=>h.fileId==='older-23'));assert.equal(after.history.at(-1).snapshot.name,'New revision');
});
test('notebook semantic updates and deletion protect the final page',async t=>{
 const {engine}=await setup(t);let file=(await engine.execute({operation:'file.create',kind:'notebook',name:'Notes',requestId:'create'})).file;const pageId=file.data.pages[0].id;
 file=(await engine.execute(validateCommand({operation:'notebook.updatePage',fileId:file.id,expectedRevision:file.revision,requestId:'update',pageId,title:'First',text:'My note'}))).file;assert.equal(file.data.pages[0].text,'My note');
 await assert.rejects(engine.execute({operation:'notebook.deletePage',fileId:file.id,expectedRevision:file.revision,requestId:'delete-last',pageId}),e=>e.code==='INVALID_DATA');
 file=(await engine.execute({operation:'notebook.addPage',fileId:file.id,expectedRevision:file.revision,requestId:'add',title:'Second',text:''})).file;
 file=(await engine.execute(validateCommand({operation:'notebook.deletePage',fileId:file.id,expectedRevision:file.revision,requestId:'delete',pageId}))).file;assert.equal(file.data.pages.length,1);assert.equal(file.data.pages[0].title,'Second');
});
test('replacement expansion is rejected before allocation and preserves state bytes',async t=>{
 const {dir,engine}=await setup(t);const file=(await engine.execute({operation:'file.create',kind:'document',name:'Expansion control',requestId:'create',data:{content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x'.repeat(1000000)}]}]}}})).file;
 const statePath=path.join(dir,'workspace.state.json'),before=await fs.readFile(statePath);
 await assert.rejects(engine.execute({operation:'document.replaceText',fileId:file.id,expectedRevision:file.revision,requestId:'expansion',find:'x',replacement:'y'.repeat(500000)}),e=>e.code==='LIMIT_EXCEEDED');
 assert.deepEqual(await fs.readFile(statePath),before);
});
test('replacement aggregate text budget applies across individually valid nodes',async t=>{
 const {dir,engine}=await setup(t);const file=(await engine.execute({operation:'file.create',kind:'document',name:'Aggregate control',requestId:'create',data:{content:{type:'doc',content:Array.from({length:11},()=>({type:'paragraph',content:[{type:'text',text:'x'.repeat(100000)}]}))}}})).file;
 const statePath=path.join(dir,'workspace.state.json'),before=await fs.readFile(statePath);await assert.rejects(engine.execute({operation:'document.replaceText',fileId:file.id,expectedRevision:file.revision,requestId:'aggregate',find:'x',replacement:'0123456789'}),e=>e.code==='LIMIT_EXCEEDED'&&e.message.includes('10 MiB'));assert.deepEqual(await fs.readFile(statePath),before);
});
