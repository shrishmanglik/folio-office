const fs=require('node:fs/promises');
const path=require('node:path');
const KINDS=new Set(['document','spreadsheet','presentation','notebook']);
function validate(files){
 if(!Array.isArray(files)||files.length>10000)throw Error('Invalid workspace');
 const ids=new Set();
 for(const f of files){if(!f||typeof f.id!=='string'||ids.has(f.id)||typeof f.name!=='string'||!KINDS.has(f.kind)||typeof f.updatedAt!=='string'||!('data' in f))throw Error('Invalid workspace file');ids.add(f.id);}
 const json=JSON.stringify(files);if(Buffer.byteLength(json)>100*1024*1024)throw Error('Workspace is too large. Export large files first.');return json;
}
async function load(dir){
 await fs.mkdir(dir,{recursive:true});
 try{const files=JSON.parse(await fs.readFile(path.join(dir,'workspace.json'),'utf8'));validate(files);return files;}
 catch(e){if(e.code==='ENOENT')return [];throw Error('Workspace could not be read. Your files have not been replaced. Recovery copies are in the workspace folder.');}
}
async function save(dir,files){
 const json=validate(files);await fs.mkdir(dir,{recursive:true});const dest=path.join(dir,'workspace.json');
 try{await fs.copyFile(dest,path.join(dir,'workspace.previous.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const temp=path.join(dir,'workspace.pending.json');const handle=await fs.open(temp,'w');try{await handle.writeFile(json,'utf8');await handle.sync();}finally{await handle.close();}
 await fs.rename(temp,dest);
}
module.exports={load,save,validate};
