// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi}from'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within}from'@testing-library/react';
import {FormulaEngine}from'../shared/formulas.mjs';
import FolioSovereignCommandSuite,{FOLIO_COMMAND_WORKSPACES,FOLIO_FOUR_IN_ONE_PILLARS,FOLIO_NATIVE_PRESETS}from'./FolioSovereignCommandSuite';
import type{EnsureTemplatesResult,FolioTemplateSeed,OfficeFile}from'./types';

afterEach(()=>{cleanup();vi.restoreAllMocks();});

const deferred=<T,>()=>{let resolve!:(value:T)=>void;let reject!:(reason?:unknown)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const acknowledgedFiles=():OfficeFile[]=>FOLIO_FOUR_IN_ONE_PILLARS.map((seed,index)=>({
 id:`template-${index+1}`,
 templateId:seed.templateId,
 kind:seed.kind,
 name:seed.name,
 data:seed.data,
 updatedAt:'2026-10-22T00:00:00.000Z',
}));
const expectedReceipt=(files=acknowledgedFiles(),createdIds=files.map(file=>file.id),existingIds:string[]=[]):string=>[
 'Folio Office 4-in-1 Sovereign Template Receipt',
 'Persona: Solo Founder ($300/yr · $1,500 / 5 yrs saved)',
 'Illustrative annual cloud-seat fee comparison: $300/yr',
 'Illustrative five-year comparison: $1,500 / 5 yrs saved',
 'Cost boundary: Excludes future acquisition price and buyer hardware costs.',
 'Storage: browser-preview',
 `Created File IDs: ${createdIds.length?createdIds.join(' | '):'none'}`,
 `Existing File IDs: ${existingIds.length?existingIds.join(' | '):'none'}`,
 'Acknowledged Files:',
 ...files.map(file=>`${file.kind} | ${file.name} | ${file.id}`),
].join('\n');
const installClipboard=(writeText:ReturnType<typeof vi.fn>)=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});

describe('Folio interactive financial and seat-tax simulator',()=>{
 it('starts inside the workspace panel with the default scenario and preserves existing controls',()=>{
  render(<FolioSovereignCommandSuite/>);
  const panel=screen.getByRole('tabpanel');
  expect(within(panel).getByTestId('folio-interactive-simulator')).toBeTruthy();
  expect(screen.getByRole('spinbutton',{name:'Monthly Recurring Revenue (CAD)'}).getAttribute('value')).toBe('24000');
  expect(screen.getByRole('spinbutton',{name:'Monthly Operating Burn (CAD)'}).getAttribute('value')).toBe('8400');
  expect(screen.getByRole('spinbutton',{name:'Team Seat Count'}).getAttribute('value')).toBe('10');
  expect(screen.getByTestId('folio-sim-net-cash').textContent).toBe('CAD 15,600');
  expect(screen.getByTestId('folio-sim-margin-pct').textContent).toBe('65%');
  expect(screen.getByTestId('folio-sim-seat-tax-saved').textContent).toBe('CAD 5,280/yr');
  expect(screen.getByTestId('folio-command-suite')).toBeTruthy();
  expect(screen.getByTestId('folio-tri-surface-bar')).toBeTruthy();
  for(const preset of FOLIO_NATIVE_PRESETS)expect(screen.getByTestId(`folio-native-preset-${preset.id}`)).toBeTruthy();
  for(const workspace of FOLIO_COMMAND_WORKSPACES)expect(screen.getByTestId(`folio-workspace-tab-${workspace.id}`)).toBeTruthy();
 });

 it('updates cash flow and rounded margin as revenue and burn change',()=>{
  render(<FolioSovereignCommandSuite/>);
  fireEvent.change(screen.getByTestId('folio-sim-mrr-input'),{target:{value:'30000'}});
  expect(screen.getByTestId('folio-sim-net-cash').textContent).toBe('CAD 21,600');
  expect(screen.getByTestId('folio-sim-margin-pct').textContent).toBe('72%');
  fireEvent.change(screen.getByTestId('folio-sim-burn-input'),{target:{value:'10000'}});
  expect(screen.getByTestId('folio-sim-net-cash').textContent).toBe('CAD 20,000');
  expect(screen.getByTestId('folio-sim-margin-pct').textContent).toBe('67%');
 });

 it('reports a loss and handles zero or cleared revenue without a non-finite margin',()=>{
  render(<FolioSovereignCommandSuite/>);
  fireEvent.change(screen.getByTestId('folio-sim-mrr-input'),{target:{value:'4000'}});
  expect(screen.getByTestId('folio-sim-net-cash').textContent).toBe('CAD -4,400');
  expect(screen.getByTestId('folio-sim-margin-pct').textContent).toBe('-110%');
  for(const value of ['0','']){
   fireEvent.change(screen.getByTestId('folio-sim-mrr-input'),{target:{value}});
   expect(screen.getByTestId('folio-sim-net-cash').textContent).toBe('CAD -8,400');
   expect(screen.getByTestId('folio-sim-margin-pct').textContent).toBe('0%');
  }
 });

 it.each([[5,'CAD 2,640/yr'],[0,'CAD 528/yr'],[-2,'CAD 528/yr']])('updates annual seat savings for %s seats',(seats,saved)=>{
  render(<FolioSovereignCommandSuite/>);
  fireEvent.change(screen.getByTestId('folio-sim-seats-input'),{target:{value:String(seats)}});
  expect(screen.getByTestId('folio-sim-seat-tax-saved').textContent).toBe(saved);
 });

 it('opens an editable spreadsheet with the current inputs and a working cash-flow formula',()=>{
  const onCreate=vi.fn();
  render(<FolioSovereignCommandSuite onCreate={onCreate}/>);
  fireEvent.change(screen.getByTestId('folio-sim-mrr-input'),{target:{value:'32000'}});
  fireEvent.change(screen.getByTestId('folio-sim-burn-input'),{target:{value:'12000'}});
  fireEvent.change(screen.getByTestId('folio-sim-seats-input'),{target:{value:'4'}});
  fireEvent.click(screen.getByRole('button',{name:'Open Simulated Financial Grid in Editor'}));
  expect(onCreate).toHaveBeenCalledExactlyOnceWith('spreadsheet','Simulated Sovereign P&L & Seat-Tax Audit',expect.objectContaining({
   sheets:[expect.objectContaining({
    id:'simulation',
    cells:[['Simulated Sovereign P&L & Seat-Tax Audit','CAD'],['Monthly Recurring Revenue','32000'],['Operating Burn','12000'],['Net Cash Flow','=B2-B3'],['Annual Cloud Seat Tax Saved','2112']],
   })],
   activeSheet:'simulation',
  }));
  const data=onCreate.mock.calls[0][2];
  const engine=FormulaEngine.buildFromArray(data.sheets[0].cells);
  try{expect(engine.getCellValue({sheet:0,row:3,col:1})).toBe(20000);}finally{engine.destroy();}
 });

 it('uses the same one-seat savings floor in the generated grid',()=>{
  const onCreate=vi.fn();
  render(<FolioSovereignCommandSuite onCreate={onCreate}/>);
  fireEvent.change(screen.getByTestId('folio-sim-seats-input'),{target:{value:'0'}});
  fireEvent.click(screen.getByTestId('folio-launch-simulated-sheet-btn'));
  expect(onCreate.mock.calls[0][2].sheets[0].cells[4][1]).toBe('528');
 });

 it('keeps the simulated sheet action disabled until the workspace is ready',()=>{
  const onCreate=vi.fn();
  const{rerender}=render(<FolioSovereignCommandSuite ready={false} onCreate={onCreate}/>);
  const button=screen.getByRole('button',{name:'Open Simulated Financial Grid in Editor'});
  expect(button).toBe(screen.getByTestId('folio-launch-simulated-sheet-btn'));
  expect(button.hasAttribute('disabled')).toBe(true);
  fireEvent.click(button);
  expect(onCreate).not.toHaveBeenCalled();
  rerender(<FolioSovereignCommandSuite ready onCreate={onCreate}/>);
  expect(button.hasAttribute('disabled')).toBe(false);
  fireEvent.click(button);
  expect(onCreate).toHaveBeenCalledOnce();
 });

 it('renders the zero-rent strip, preserves individual template launch, and keeps the local AI workbench',()=>{
  const onCreate=vi.fn();
  render(<FolioSovereignCommandSuite onCreate={onCreate}/>);
  expect(screen.getByTestId('zero-rent-annual-tax-killer-strip')).toBeTruthy();
  expect(screen.getByTestId('zero-rent-annual-saved-readout').textContent).toBe('$300/yr');
  expect(screen.getByTestId('zero-rent-five-year-saved-readout').textContent).toBe('$1,500 / 5 yrs saved');
  fireEvent.click(screen.getByTestId('zero-rent-persona-pill-family-business'));
  expect(screen.getByTestId('zero-rent-annual-saved-readout').textContent).toBe('$1,500/yr');
  expect(screen.getByTestId('zero-rent-five-year-saved-readout').textContent).toBe('$7,500 / 5 yrs saved');
  expect(screen.getByTestId('zero-lockout-hard-drive-guarantee').textContent).toContain('Never Locked Out of Your Own Work');

  expect(screen.getByTestId('four-in-one-workspace-deck')).toBeTruthy();
  fireEvent.click(screen.getByTestId('launch-four-in-one-notebook'));
  expect(onCreate).toHaveBeenCalledWith('notebook','Research & Engineering Notebook',expect.any(Object),'research-eng-notebook');

  expect(screen.getByTestId('private-local-ai-assistant-workbench')).toBeTruthy();
  fireEvent.click(screen.getByTestId('local-ai-task-pill-presentation-deck'));
  expect(screen.getByTestId('local-ai-execution-output').textContent).toContain('127.0.0.1:11434');
  fireEvent.click(screen.getByTestId('local-ai-apply-to-file-btn'));
  expect(onCreate).toHaveBeenCalledWith('presentation','3-Bullet Board Narrative Deck',expect.any(Object));
 });
});

describe('four-in-one persisted receipt',()=>{
 it('without a persistence callback reports preview-only state and never claims files were saved or copied',async()=>{
  const writeText=vi.fn().mockResolvedValue(undefined);installClipboard(writeText);
  render(<FolioSovereignCommandSuite/>);

  fireEvent.click(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn'));

  const status=await screen.findByTestId('copy-four-in-one-sovereign-receipt-status');
  expect(status.textContent).toMatch(/preview/i);
  expect(status.textContent).toMatch(/not saved/i);
  expect(status.textContent).toMatch(/not copied/i);
  expect(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn').textContent).not.toMatch(/saved|copied/i);
  expect(writeText).not.toHaveBeenCalled();
 });

 it('disables duplicate launches while persistence is pending and waits for clipboard before claiming copied',async()=>{
  const save=deferred<EnsureTemplatesResult>();
  const copy=deferred<void>();
  const onEnsureTemplates=vi.fn<(seeds:readonly FolioTemplateSeed[])=>Promise<EnsureTemplatesResult>>(()=>save.promise);
  const writeText=vi.fn(()=>copy.promise);installClipboard(writeText);
  render(<FolioSovereignCommandSuite onEnsureTemplates={onEnsureTemplates}/>);
  const button=screen.getByTestId('copy-four-in-one-sovereign-receipt-btn')as HTMLButtonElement;

  fireEvent.click(button);fireEvent.click(button);
  expect(button.disabled).toBe(true);
  for(const pillar of FOLIO_FOUR_IN_ONE_PILLARS)expect((screen.getByTestId(`launch-four-in-one-${pillar.id}`)as HTMLButtonElement).disabled).toBe(true);
  expect(onEnsureTemplates).toHaveBeenCalledOnce();
  expect(onEnsureTemplates.mock.calls[0][0]).toEqual(FOLIO_FOUR_IN_ONE_PILLARS);
  expect(writeText).not.toHaveBeenCalled();

  const files=acknowledgedFiles();
  save.resolve({ok:true,files,createdIds:files.map(file=>file.id),existingIds:[],storage:'browser-preview'});
  await waitFor(()=>expect(writeText).toHaveBeenCalledExactlyOnceWith(expectedReceipt(files)));
  expect(button.textContent).not.toMatch(/copied/i);
  copy.resolve();
  await waitFor(()=>expect(button.textContent).toMatch(/copied/i));
 });

 it.each(['rejected','missing']as const)('exposes the exact receipt for manual copy when clipboard is %s',async(mode)=>{
  const onEnsureTemplates=vi.fn().mockResolvedValue({ok:true,files:acknowledgedFiles(),createdIds:['template-1','template-2','template-3','template-4'],existingIds:[],storage:'browser-preview'});
  if(mode==='rejected')installClipboard(vi.fn().mockRejectedValue(new Error('denied')));
  else Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
  render(<FolioSovereignCommandSuite onEnsureTemplates={onEnsureTemplates}/>);

  fireEvent.click(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn'));

  const status=await screen.findByTestId('copy-four-in-one-sovereign-receipt-status');
  expect(status.textContent).toMatch(/files saved/i);
  expect(status.textContent).toMatch(/not copied/i);
  const fallback=screen.getByTestId('copy-four-in-one-sovereign-receipt-fallback')as HTMLTextAreaElement;
  expect(fallback.readOnly).toBe(true);
  expect(fallback.rows).toBe(13);
  expect(fallback.value).toBe(expectedReceipt());
 });

 it('never claims saved or copied when persistence fails',async()=>{
  const writeText=vi.fn().mockResolvedValue(undefined);installClipboard(writeText);
  const onEnsureTemplates=vi.fn().mockResolvedValue({ok:false,error:'Save failed'});
  render(<FolioSovereignCommandSuite onEnsureTemplates={onEnsureTemplates}/>);

  fireEvent.click(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn'));

  const status=await screen.findByTestId('copy-four-in-one-sovereign-receipt-status');
  expect(status.textContent).toMatch(/save failed/i);
  expect(status.textContent).not.toMatch(/files saved|copied/i);
  expect(writeText).not.toHaveBeenCalled();
 });

 it('binds a pending write to the persona selected when it began',async()=>{
  const save=deferred<EnsureTemplatesResult>();
  const onEnsureTemplates=vi.fn<(seeds:readonly FolioTemplateSeed[])=>Promise<EnsureTemplatesResult>>(()=>save.promise);
  const writeText=vi.fn().mockResolvedValue(undefined);installClipboard(writeText);
  render(<FolioSovereignCommandSuite onEnsureTemplates={onEnsureTemplates}/>);

  fireEvent.click(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn'));
  fireEvent.click(screen.getByTestId('zero-rent-persona-pill-family-business'));
  save.resolve({ok:true,files:acknowledgedFiles(),createdIds:['template-1','template-2','template-3','template-4'],existingIds:[],storage:'browser-preview'});

  await waitFor(()=>expect(writeText).toHaveBeenCalledOnce());
  expect(writeText.mock.calls[0][0]).toBe(expectedReceipt());
  expect(writeText.mock.calls[0][0]).not.toContain('Persona: 5-Person Family Business');
  expect(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn').textContent).not.toMatch(/copied/i);
  expect(screen.getByTestId('copy-four-in-one-sovereign-receipt-status').textContent).toMatch(/ready for the current persona/i);
 });

 it('revalidates storage on clipboard retry and reports zero new files for the existing acknowledgement',async()=>{
  const writeText=vi.fn().mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce(undefined);installClipboard(writeText);
  const files=acknowledgedFiles();
  const renamed=files.map((file,index)=>index?file:{...file,name:'My edited executive audit'});
  const onEnsureTemplates=vi.fn()
   .mockResolvedValueOnce({ok:true,files,createdIds:files.map(file=>file.id),existingIds:[],storage:'browser-preview'})
   .mockResolvedValueOnce({ok:true,files:renamed,createdIds:[],existingIds:renamed.map(file=>file.id),storage:'browser-preview'});
  render(<FolioSovereignCommandSuite onEnsureTemplates={onEnsureTemplates}/>);
  const button=screen.getByTestId('copy-four-in-one-sovereign-receipt-btn');

  fireEvent.click(button);
  await screen.findByTestId('copy-four-in-one-sovereign-receipt-fallback');
  fireEvent.click(button);

  await waitFor(()=>expect(writeText).toHaveBeenCalledTimes(2));
  expect(onEnsureTemplates).toHaveBeenCalledTimes(2);
  expect(writeText.mock.calls[1][0]).toBe(expectedReceipt(renamed,[],renamed.map(file=>file.id)));
  expect(writeText.mock.calls[1][0]).toContain('My edited executive audit');
  expect((await screen.findByTestId('copy-four-in-one-sovereign-receipt-status')).textContent).toMatch(/copied/i);
  expect(button.textContent).not.toMatch(/created|recreated|launched/i);
 });

 it('serializes the actual acknowledged IDs, kinds, and renamed files with illustrative cost boundaries',async()=>{
  const files=acknowledgedFiles().map((file,index)=>index?file:{...file,name:'My edited executive audit'});
  const onEnsureTemplates=vi.fn().mockResolvedValue({ok:true,files,createdIds:[],existingIds:files.map(file=>file.id),storage:'browser-preview'});
  const writeText=vi.fn().mockResolvedValue(undefined);installClipboard(writeText);
  render(<FolioSovereignCommandSuite onEnsureTemplates={onEnsureTemplates}/>);

  fireEvent.click(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn'));

  await waitFor(()=>expect(writeText).toHaveBeenCalledExactlyOnceWith(expectedReceipt(files,[],files.map(file=>file.id))));
  const receipt=writeText.mock.calls[0][0];
  expect(receipt).toContain('document | My edited executive audit | template-1');
  expect(receipt).not.toContain('Annual Cloud Tax Eliminated');
  expect(receipt).not.toContain('5-Year Capital Retained');
 });

 it.each([
  ['incomplete',acknowledgedFiles().slice(0,3)],
  ['duplicate IDs',[...acknowledgedFiles().slice(0,3),acknowledgedFiles()[0]]],
 ] as const)('refuses an unconfirmed ok acknowledgement with %s files',async(_case,files)=>{
  const writeText=vi.fn().mockResolvedValue(undefined);installClipboard(writeText);
  const onEnsureTemplates=vi.fn().mockResolvedValue({ok:true,files:[...files],createdIds:[...files].map(file=>file.id),existingIds:[],storage:'browser-preview'});
  render(<FolioSovereignCommandSuite onEnsureTemplates={onEnsureTemplates}/>);

  fireEvent.click(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn'));

  const status=await screen.findByTestId('copy-four-in-one-sovereign-receipt-status');
  expect(status.textContent).toMatch(/unconfirmed/i);
  expect(status.textContent).not.toMatch(/copied/i);
  expect(writeText).not.toHaveBeenCalled();
 });
});
