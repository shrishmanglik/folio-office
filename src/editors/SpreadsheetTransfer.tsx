import { useEffect, useRef, useState } from 'react';
import { applySpreadsheetCommand } from '../../shared/spreadsheet-operations.mjs';
import type { SpreadsheetData } from './SpreadsheetEditor';

type Props = { data: SpreadsheetData; sheetId: string; range: string; onApply: (next: SpreadsheetData) => void };
export default function SpreadsheetTransfer({data,sheetId,range,onApply}:Props) {
 const menu=useRef<HTMLDetailsElement>(null);
 const [target,setTarget]=useState('D1'),[targetSheet,setTargetSheet]=useState(sheetId),[mode,setMode]=useState('all'),[transpose,setTranspose]=useState(false),[skipBlanks,setSkipBlanks]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!data.sheets.some(s=>s.id===targetSheet))setTargetSheet(sheetId);},[data.sheets,sheetId,targetSheet]);
 useEffect(()=>{const close=(e:PointerEvent)=>{if(!menu.current?.contains(e.target as Node))menu.current?.removeAttribute('open');};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 return <details ref={menu} className="sheet-transfer" style={{position:'relative'}} onKeyDown={e=>{if(e.key==='Escape'){menu.current?.removeAttribute('open');menu.current?.querySelector('summary')?.focus();}}}>
  <summary style={{cursor:'pointer',padding:'6px 9px',border:'1px solid #cddbd3',borderRadius:6}}>Copy range to...</summary>
  <form aria-label="Copy range options" onSubmit={e=>{e.preventDefault();try{const next=applySpreadsheetCommand(data,{action:'copyRange',sheetId,range,target:target.trim().toUpperCase(),targetSheetId:targetSheet,mode,transpose,skipBlanks});onApply(next);setError('');menu.current?.removeAttribute('open');}catch(error){setError(error instanceof Error?error.message:String(error));}}} style={{position:'absolute',left:0,top:'calc(100% + 8px)',zIndex:30,width:290,padding:16,display:'grid',gap:10,background:'#fff',border:'1px solid #bdd0c4',borderRadius:12,boxShadow:'0 12px 30px #153c2529'}}>
   <strong>Copy {range}</strong><span style={{fontSize:12,color:'#53675b'}}>Destination cells will be overwritten. Undo restores them.</span>
   <label>Destination sheet<select aria-label="Copy destination sheet" value={targetSheet} onChange={e=>setTargetSheet(e.target.value)}>{data.sheets.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>Starting cell<input aria-label="Copy destination cell" value={target} onChange={e=>setTarget(e.target.value)} maxLength={8}/></label>
   <label>Paste options<select aria-label="Copy paste mode" value={mode} onChange={e=>setMode(e.target.value)}><option value="all">Everything</option><option value="values">Calculated values only</option><option value="formulas">Formulas and contents only</option><option value="formats">Formatting only</option></select></label>
   <label><input type="checkbox" aria-label="Transpose copied range" checked={transpose} onChange={e=>setTranspose(e.target.checked)}/> Transpose rows and columns</label>
   <label><input type="checkbox" aria-label="Skip source blanks" checked={skipBlanks} onChange={e=>setSkipBlanks(e.target.checked)}/> Keep destination where source is blank</label>
   {error&&<span role="alert" style={{color:'#a33226'}}>{error}</span>}
   <button type="submit">Apply range copy</button>
  </form>
 </details>;
}
