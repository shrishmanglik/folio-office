const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const typescript=require('typescript');
const {createEngine,validateFiles}=require('../core/engine.cjs');

const worktreeRoot=path.resolve(__dirname,'..');
const qaRoot=path.resolve(worktreeRoot,'run','qa');

function assertOwnedFixture(target){
 const resolved=path.resolve(target);
 assert.ok(resolved.startsWith(qaRoot+path.sep),`Fixture must remain below ${qaRoot}`);
 return resolved;
}

function loadSuiteExports(){
 const filename=path.join(worktreeRoot,'src','FolioSovereignCommandSuite.tsx');
 const compiled=typescript.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:typescript.ModuleKind.CommonJS,jsx:typescript.JsxEmit.ReactJSX}});
 const loaded=new Module(filename,module);
 loaded.filename=filename;
 loaded.paths=Module._nodeModulePaths(path.dirname(filename));
 loaded._compile(compiled.outputText,filename);
 return loaded.exports;
}

test('four canonical templates validate and retain provenance through native snapshot persistence',async()=>{
 const fixture=assertOwnedFixture(path.join(qaRoot,`four-in-one-${process.pid}-${Date.now()}`));
 await fs.promises.mkdir(fixture,{recursive:true});
 try{
  const seeds=loadSuiteExports().FOLIO_FOUR_IN_ONE_PILLARS;
  assert.equal(seeds.length,4);
  const files=seeds.map((seed,index)=>({
   id:`four-in-one-${index+1}`,
   templateId:seed.templateId,
   name:seed.name,
   kind:seed.kind,
   updatedAt:'2026-10-22T00:00:00.000Z',
   data:structuredClone(seed.data),
  }));

  assert.equal(validateFiles(structuredClone(files)).length,4);
  const engine=createEngine(fixture);
  const saved=await engine.saveSnapshot(files,[]);
  assert.equal(saved.length,4);
  const readback=await engine.snapshot();
  assert.deepEqual(readback.map(file=>({id:file.id,templateId:file.templateId,name:file.name,kind:file.kind})),files.map(file=>({id:file.id,templateId:file.templateId,name:file.name,kind:file.kind})));
  assert.equal(readback.find(file=>file.kind==='notebook').data.pages.length,2);
  assert.equal(readback.find(file=>file.kind==='presentation').data.slides.length,2);

  const edited=readback.map(file=>file.kind==='document'?{...file,name:'My edited executive audit',data:{html:'<h1>Retained edited work</h1>'}}:file);
  const savedAgain=await engine.saveSnapshot(edited,readback);
  const editedReadback=savedAgain.find(file=>file.kind==='document');
  const originalDocument=files.find(file=>file.kind==='document');
  assert.equal(editedReadback.id,originalDocument.id);
  assert.equal(editedReadback.templateId,originalDocument.templateId);
  assert.equal(editedReadback.name,'My edited executive audit');
  assert.deepEqual(editedReadback.data,{html:'<h1>Retained edited work</h1>'});
 }finally{
  assertOwnedFixture(fixture);
  await fs.promises.rm(fixture,{recursive:true,force:true});
 }
});

test('both individual template launch surfaces pass the canonical template id as the fourth create argument',()=>{
 const workspace=fs.readFileSync(path.join(worktreeRoot,'src','Workspace.tsx'),'utf8');
 const suite=fs.readFileSync(path.join(worktreeRoot,'src','FolioSovereignCommandSuite.tsx'),'utf8');
 assert.match(workspace,/p\.onCreate\(seed\.kind,seed\.name,seed\.data,seed\.templateId\)/);
 assert.match(suite,/onCreate\?\.\(pillar\.kind,pillar\.name,pillar\.data,pillar\.templateId\)/);
});
