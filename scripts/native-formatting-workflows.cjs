// Real Electron acceptance with a synthetic workspace. No personal files are opened.
const {_electron}=require('playwright');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {createEngine}=require('../core/engine.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/formatting-v8');await fs.mkdir(out,{recursive:true});
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'folio-format-v8-')),engine=createEngine(path.join(profile,'Workspace'));
 const made=await engine.execute({operation:'file.create',kind:'spreadsheet',name:'Formatting workbook',requestId:'seed',data:{sheets:[{id:'data',name:'Plan',cells:[['Task','Hours','Note'],['Design','12','A.b to replace'],['Research','5','a.B to replace'],['Build','30','A.b to replace'],[],[],['10','=A7*2'],['5','=A8*2'],['3','=A9*2']],rows:40,cols:16},{id:'target',name:'Results',cells:[]}],activeSheet:'data'}});
 const report={checks:[],errors:[],fixture:'Synthetic workbook; actual Electron renderer and persistent shared engine'};let app,p;
 const env={...process.env,OFFICE_TEST_DATA:profile};delete env.ELECTRON_RUN_AS_NODE;
 const launch=async()=>{app=await _electron.launch({executablePath:process.env.OFFICE_EXECUTABLE||require('electron'),args:process.env.OFFICE_PACKAGED?[]:[root],env});p=await app.firstWindow();p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));await p.getByRole('button',{name:'Formatting workbook',exact:true}).click();};
 const select=async(range)=>{await p.getByLabel('Select cell or range').fill(range);await p.getByLabel('Select cell or range').press('Enter');};
 try{
  await launch();await select('A1:C1');await p.locator('.sheet-format-menu summary').click();
  await p.getByLabel('Font family',{exact:true}).selectOption('Georgia');await p.getByLabel('Font size',{exact:true}).fill('18');await p.getByLabel('Font size',{exact:true}).press('Enter');await p.getByLabel('Underline cell',{exact:true}).click();await p.getByLabel('Outside borders',{exact:true}).click();await p.getByLabel('Vertical alignment',{exact:true}).selectOption('top');
  await p.getByLabel('Wrap cell text',{exact:true}).click();await p.getByLabel('Text rotation',{exact:true}).fill('15');await p.getByLabel('Text rotation',{exact:true}).press('Enter');
  const style=await p.locator('[data-cell="A1"]').evaluate(el=>({family:el.style.fontFamily,size:el.style.fontSize,underline:el.style.textDecoration,wrap:el.style.whiteSpace,border:el.style.borderTop,vertical:el.style.verticalAlign,rotation:el.querySelector('span').style.transform}));
  assert.match(style.family,/Georgia/);assert.equal(style.size,'18pt');assert.match(style.underline,/underline/);assert.equal(style.wrap,'normal');assert.equal(style.vertical,'top');assert.match(style.border,/1px solid/);assert.equal(style.rotation,'rotate(-15deg)');
  report.checks.push('Font, underline, wrapping, vertical alignment, rotation and physical borders render after UI range formatting');
  await p.screenshot({path:path.join(out,'formatting-panel.png')});await p.getByLabel('Font size',{exact:true}).press('Escape');
  await select('B7:B9');await p.getByRole('button',{name:'Fill up',exact:true}).click();assert.equal(await p.locator('[data-cell="B7"]').textContent(),'20');
  report.checks.push('Fill up adjusts formula references from the bottom source');
  await select('A7:B9');await p.locator('.sheet-transfer summary').click();await p.getByLabel('Copy destination sheet').selectOption('target');await p.getByLabel('Copy destination cell').fill('A1');await p.getByLabel('Copy paste mode').selectOption('values');await p.getByLabel('Transpose copied range').check();await p.getByRole('button',{name:'Apply range copy',exact:true}).click();
  await p.getByRole('button',{name:'Results',exact:true}).click();assert.equal(await p.locator('[data-cell="A2"]').textContent(),'20');assert.equal(await p.locator('[data-cell="C2"]').textContent(),'6');
  report.checks.push('Native range copy freezes calculated values and transposes to another worksheet');
  await p.getByRole('button',{name:'Plan',exact:true}).click();await select('C2:C4');await p.locator('.sheet-replace-menu summary').click();await p.getByLabel('Find text',{exact:true}).fill('a.b');await p.getByLabel('Replace with',{exact:true}).fill('Done');await p.getByRole('button',{name:'Replace in selection',exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('[data-cell="C2"]')?.textContent==='Done to replace');await p.getByLabel('Spreadsheet grid').press('Control+z');assert.equal(await p.locator('[data-cell="C2"]').textContent(),'A.b to replace');await p.getByLabel('Spreadsheet grid').press('Control+y');assert.equal(await p.locator('[data-cell="C2"]').textContent(),'Done to replace');
  report.checks.push('Literal case-insensitive replacement is undoable and redoable in the UI');
  await select('A1:C4');await p.screenshot({path:path.join(out,'worksheet.png')});await p.waitForTimeout(1000);
  let saved=(await engine.execute({operation:'file.read',fileId:made.file.id})).file;assert.equal(saved.data.sheets[0].styles.A1.fontFamily,'Georgia');assert.equal(saved.data.sheets[0].styles.A1.rotation,15);assert.equal(saved.data.sheets[0].cells[6][1],'=A7*2');assert.deepEqual(saved.data.sheets[1].cells,[['10','5','3'],['20','10','6']]);
  report.checks.push('Agent readback confirms persisted UI appearance, formulas and frozen values');
  await app.close();app=null;await engine.execute({operation:'spreadsheet.format',fileId:saved.id,expectedRevision:saved.revision,requestId:'agent-style',sheetId:'data',range:'B2:B4',style:{numberFormat:'0.000',italic:true}});
  await launch();await p.getByRole('button',{name:'Plan',exact:true}).click();await p.waitForFunction(()=>document.querySelector('[data-cell="B2"]')?.textContent==='12.000');assert.equal(await p.locator('[data-cell="A1"]').evaluate(el=>el.style.fontFamily),'Georgia, sans-serif');
  report.checks.push('Actual desktop restart retains changes and renders an agent-authored formatting edit');assert.deepEqual(report.errors,[]);report.result='PASS';
 }catch(e){report.result='FAIL';report.error=e.stack;process.exitCode=1;if(p)await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}
 finally{if(app)await app.close();await fs.writeFile(path.join(out,'proof.json'),JSON.stringify(report,null,2),'utf8');console.log(JSON.stringify(report));}
})();
