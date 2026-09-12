const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
test('UI source has valid UTF-8 and no known double-encoding sequences',()=>{
 const decoder=new TextDecoder('utf-8',{fatal:true});const scan=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())scan(p);else if(/\.(tsx?|css)$/.test(p)){const text=decoder.decode(fs.readFileSync(p));assert.doesNotMatch(text,/\u00e2\u20ac|\u00c6\u2019|\u00c3\u2014|\u00c2\u00b7/,p);}}};scan(path.join(__dirname,'../src'));
});
