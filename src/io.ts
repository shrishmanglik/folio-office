export async function downloadFile(name:string,data:Blob|string|ArrayBuffer|Uint8Array,ext:string,mime='application/octet-stream') {
 const blob = data instanceof Blob ? data : new Blob([data as any],{type:mime});
 if(window.office) {const result=await window.office.exportFile(name,Array.from(new Uint8Array(await blob.arrayBuffer())),ext);if(!result.ok&&!result.cancelled)throw new Error(result.error||'File could not be saved');return;}
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name.endsWith('.'+ext)?name:name+'.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
