const agentIndex=process.argv.indexOf('--agent');
if(agentIndex>=0){const {app}=require('electron');app.whenReady().then(()=>require('../agent/cli.cjs').main(process.argv.slice(agentIndex+1))).then(result=>{if(result!==undefined){process.stdout.write(JSON.stringify(result)+'\n',()=>app.exit(0));}}).catch(error=>{process.stderr.write(JSON.stringify({error:{code:error.code||'INTERNAL_ERROR',message:error.message}})+'\n',()=>app.exit(1));});}else{
const {app,BrowserWindow,ipcMain,dialog,session,shell,Menu}=require('electron');
const path=require('node:path');const fs=require('node:fs/promises');const {pathToFileURL}=require('node:url');const storage=require('./storage.cjs');
if(process.env.OFFICE_TEST_DATA)app.setPath('userData',process.env.OFFICE_TEST_DATA);
app.setName('Office Workspace');
let win;let queue=Promise.resolve();
const entry=pathToFileURL(path.join(__dirname,'../dist/index.html')).href;
function allowed(event){if(!event.senderFrame||event.senderFrame.url!==entry)throw Error('Untrusted request');}
function createWindow(){
 win=new BrowserWindow({width:1440,height:960,minWidth:760,minHeight:600,title:'Office Workspace',backgroundColor:'#f5f6f8',show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(event,url)=>{if(url!==entry)event.preventDefault();});
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,cb)=>cb(false));
 win.loadFile(path.join(__dirname,'../dist/index.html'));win.once('ready-to-show',()=>win.show());
 win.on('close',event=>{if(!win.__safeClose){event.preventDefault();win.webContents.send('office:closing');}});
}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
 app.whenReady().then(()=>{
  const dir=path.join(app.getPath('userData'),'Workspace');const engine=require('../core/engine.cjs').createEngine(dir);
  session.defaultSession.webRequest.onBeforeRequest((details,cb)=>cb({cancel:/^(https?|wss?|ftp):/i.test(details.url)}));
  ipcMain.handle('office:load',async e=>{allowed(e);return engine.snapshot();});
  ipcMain.handle('office:save',async(e,files,baseline)=>{allowed(e);if(!Array.isArray(baseline))throw Error('Baseline is required');const job=queue.then(()=>engine.saveSnapshot(files,baseline));queue=job.catch(()=>{});try{const saved=await job;return {ok:true,files:saved};}catch(err){return {ok:false,error:err.message,code:err.code,details:err.details};}});
  ipcMain.handle('office:export',async(e,name,bytes,ext)=>{allowed(e);if(typeof name!=='string'||!Array.isArray(bytes)||bytes.length>100*1024*1024||!['docx','html','txt','csv','xlsx','pptx','json','pdf','md'].includes(ext))throw Error('Invalid export');const result=await dialog.showSaveDialog(win,{defaultPath:path.join(app.getPath('documents'),name.replace(/[<>:"/\\|?*]/g,'_').replace(new RegExp('\\.'+ext+'$','i'),'')+'.'+ext),filters:[{name:ext.toUpperCase(),extensions:[ext]}]});if(result.canceled)return{ok:false,cancelled:true};try{await fs.writeFile(result.filePath,Buffer.from(bytes));return{ok:true};}catch(err){return{ok:false,error:err.message};}});
  async function temporaryConversion(run){const root=path.resolve(app.getPath('temp'));const temp=await fs.mkdtemp(path.join(root,'office-convert-'));try{return await run(temp);}finally{if(path.dirname(path.resolve(temp))===root&&path.basename(temp).startsWith('office-convert-'))await fs.rm(temp,{recursive:true,force:true});}}
  ipcMain.handle('office:convert-import',async(e,name,bytes,kind)=>{allowed(e);if(typeof name!=='string'||!Array.isArray(bytes)||bytes.length>25*1024*1024||!bytes.every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Invalid import');return temporaryConversion(async temp=>{const input=path.join(temp,'input'+path.extname(name).toLowerCase());await fs.writeFile(input,Buffer.from(bytes));const result=await require('../core/formats.cjs').importFile(input,kind,path.basename(name,path.extname(name)));require('../core/engine.cjs').validateFiles([{id:'import-preview',name:result.name,kind:result.kind,data:result.data,updatedAt:new Date().toISOString()}]);return result;});});
  ipcMain.handle('office:convert-export',async(e,file,format)=>{allowed(e);require('../core/engine.cjs').validateFiles([file]);if(typeof format!=='string'||!/^([a-z0-9]{2,5})$/.test(format))throw Error('Invalid format');return temporaryConversion(async temp=>{const output=path.join(temp,'output.'+format);const result=await require('../core/formats.cjs').exportFile(file,format,output);const chosen=await dialog.showSaveDialog(win,{defaultPath:path.join(app.getPath('documents'),file.name.replace(/[<>:"/\\|?*]/g,'_')+'.'+format),filters:[{name:format.toUpperCase(),extensions:[format]}]});if(chosen.canceled)return{ok:false,cancelled:true,warnings:result.warnings};const pending=chosen.filePath+'.'+require('node:crypto').randomUUID()+'.partial';try{await fs.copyFile(output,pending);await fs.rename(pending,chosen.filePath);}catch(error){await fs.unlink(pending).catch(()=>{});throw error;}return{ok:true,warnings:result.warnings};});});
  ipcMain.handle('office:command',async(e,command)=>{allowed(e);if(!['file.read','file.history','file.restore','document.replaceText','document.format','spreadsheet.format'].includes(command?.operation))throw Error('Unsupported UI command');return engine.execute(require('../agent/tool-definitions.cjs').validateCommand(command));});
  ipcMain.handle('office:validate',async(e,files)=>{allowed(e);try{require('../core/engine.cjs').validateFiles(files);return {ok:true};}catch(error){return {ok:false,error:error.message};}});
  ipcMain.handle('office:search',async(e,query)=>{allowed(e);return engine.execute({operation:'workspace.search',query,limit:30});});
  ipcMain.handle('office:copy-agent-config',async e=>{allowed(e);const config={mcpServers:{office:{command:process.execPath,args:[path.join(app.getAppPath(),'agent','cli.cjs'),'--workspace',dir,'mcp'],env:{ELECTRON_RUN_AS_NODE:'1'}}}};require('electron').clipboard.writeText(JSON.stringify(config,null,2));});
  ipcMain.handle('office:agent-info',async e=>{allowed(e);return {workspace:dir,executable:process.execPath,mcp:{command:process.execPath,args:[path.join(app.getAppPath(),'agent','cli.cjs'),'--workspace',dir,'mcp'],env:{ELECTRON_RUN_AS_NODE:'1'}}};});
  ipcMain.handle('office:audit',async e=>{allowed(e);return engine.execute({operation:'workspace.audit',limit:20});});
  ipcMain.handle('office:folder',async e=>{allowed(e);await fs.mkdir(dir,{recursive:true});await shell.openPath(dir);});
  ipcMain.handle('office:print',async e=>{allowed(e);win.webContents.print({printBackground:true});});
  ipcMain.handle('office:close-ready',async e=>{allowed(e);await queue;win.__safeClose=true;win.close();});
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'File',submenu:[{label:'Workspace folder',click:()=>shell.openPath(dir)},{type:'separator'},{role:'quit'}]},{label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:'View',submenu:[{role:'zoomIn'},{role:'zoomOut'},{role:'resetZoom'},{role:'togglefullscreen'}]}]));
  createWindow();
 });
 app.on('window-all-closed',()=>app.quit());
}

}
