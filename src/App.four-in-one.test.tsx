// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,screen,waitFor}from'@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi}from'vitest';
import App from'./App';
import {FOLIO_FOUR_IN_ONE_PILLARS}from'./FolioSovereignCommandSuite';
import type{ComponentProps}from'react';
import type WorkspaceComponent from'./Workspace';
import type{EnsureTemplatesResult,OfficeFile}from'./types';

type CapturedWorkspaceProps=Pick<ComponentProps<typeof WorkspaceComponent>,'files'|'ready'|'onCreate'|'onEnsureTemplates'|'onOpen'|'onFavorite'|'templateBatchBusy'>;
const workspace=vi.hoisted(()=>({props:null as CapturedWorkspaceProps|null}));
vi.mock('./Workspace',()=>({default:(props:CapturedWorkspaceProps)=>{workspace.props=props;const seed=FOLIO_FOUR_IN_ONE_PILLARS[0];return <><button data-testid="launch-tagged-template" onClick={()=>props.onCreate(seed.kind,seed.name,seed.data,seed.templateId)}>Launch tagged template</button><output data-testid="workspace-file-count">{props.files.length}</output></>;}}));

beforeEach(()=>{localStorage.clear();workspace.props=null;Object.defineProperty(window,'office',{configurable:true,writable:true,value:undefined});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});

const capturedWorkspace=():CapturedWorkspaceProps=>{if(!workspace.props)throw Error('Expected App to render Workspace.');return workspace.props;};
const waitUntilReady=async()=>waitFor(()=>expect(capturedWorkspace().ready).toBe(true));
type SaveFunction=NonNullable<Window['office']>['save'];
type SaveResult=Awaited<ReturnType<SaveFunction>>;
const ensure=():Promise<EnsureTemplatesResult>=>{const callback=capturedWorkspace().onEnsureTemplates;if(!callback)throw Error('Expected App to provide onEnsureTemplates.');return callback(FOLIO_FOUR_IN_ONE_PILLARS);};
const requireSuccess=(result:EnsureTemplatesResult|undefined):Extract<EnsureTemplatesResult,{ok:true}>=>{if(!result||result.ok===false)throw Error('Expected a successful template acknowledgement.');return result;};
const existingCatalogFiles=():OfficeFile[]=>FOLIO_FOUR_IN_ONE_PILLARS.map((seed,index)=>({id:`existing-${index+1}`,templateId:seed.templateId,kind:seed.kind,name:seed.name,updatedAt:'2026-10-22T00:00:00.000Z',data:structuredClone(seed.data)}));

describe('App four-in-one persistence boundary',()=>{
 it('acknowledges one browser-preview batch only after all four files are stored',async()=>{
  render(<App/>);await waitUntilReady();

  let result:EnsureTemplatesResult|undefined;
  await act(async()=>{result=await ensure();});

  const success=requireSuccess(result);
  expect(success).toMatchObject({ok:true,storage:'browser-preview',createdIds:expect.any(Array),existingIds:[]});
  expect(success.createdIds).toHaveLength(4);
  expect(success.files).toHaveLength(4);
  expect(JSON.parse(localStorage.getItem('office-workspace-preview')||'[]')).toHaveLength(4);
  expect(capturedWorkspace().files).toHaveLength(4);
 });

 it('deduplicates by templateId and preserves a renamed, edited existing file byte-for-byte',async()=>{
  const seed=FOLIO_FOUR_IN_ONE_PILLARS[0];
  const edited={id:'edited-1',templateId:seed.templateId,kind:seed.kind,name:'My edited audit',updatedAt:'2026-10-22T01:02:03.000Z',starred:true,revision:'rev-edited',data:{html:'<h1>My retained work</h1>'}};
  localStorage.setItem('office-workspace-preview',JSON.stringify([edited]));
  render(<App/>);await waitUntilReady();

  let result:EnsureTemplatesResult|undefined;
  await act(async()=>{result=await ensure();});

  const success=requireSuccess(result);
  expect(success).toMatchObject({ok:true,storage:'browser-preview',createdIds:expect.any(Array),existingIds:['edited-1']});
  expect(success.createdIds).toHaveLength(3);
  const stored:OfficeFile[]=JSON.parse(localStorage.getItem('office-workspace-preview')||'[]');
  expect(stored).toHaveLength(4);
  expect(stored.find(file=>file.id==='edited-1')).toEqual(edited);
 });

 it('does not expose the four files or resolve success before deferred desktop persistence succeeds',async()=>{
  let finishSave!:(value:SaveResult)=>void;
  const save=vi.fn<SaveFunction>(()=>new Promise<SaveResult>(resolve=>{finishSave=resolve;}));
  Object.defineProperty(window,'office',{configurable:true,value:{load:vi.fn().mockResolvedValue([]),save}});
  render(<App/>);await waitUntilReady();

  let settled=false;let pending!:Promise<EnsureTemplatesResult>;
  act(()=>{pending=ensure().then(value=>{settled=true;return value;});});
  await waitFor(()=>expect(save).toHaveBeenCalledOnce());
  expect(settled).toBe(false);
  expect(capturedWorkspace().files).toHaveLength(0);
  const persisted=save.mock.calls[0]?.[0];
  if(!persisted)throw Error('Expected the template batch to reach desktop persistence.');
  expect(persisted).toHaveLength(4);

  finishSave({ok:true,files:persisted});
  let result:EnsureTemplatesResult|undefined;
  await act(async()=>{result=await pending;});
  expect(result).toMatchObject({ok:true,storage:'desktop-local'});
  expect(capturedWorkspace().files).toHaveLength(4);
 });

 it('returns a failure acknowledgement and leaves the visible workspace unchanged when desktop persistence fails',async()=>{
  const save=vi.fn<SaveFunction>().mockResolvedValue({ok:false,error:'Disk unavailable',code:'IO_ERROR'});
  Object.defineProperty(window,'office',{configurable:true,value:{load:vi.fn().mockResolvedValue([]),save}});
  render(<App/>);await waitUntilReady();

  let result:EnsureTemplatesResult|undefined;
  await act(async()=>{result=await ensure();});

  expect(result).toEqual({ok:false,error:'Disk unavailable'});
  expect(capturedWorkspace().files).toHaveLength(0);
  expect(save).toHaveBeenCalledOnce();
 });

 it('does not acknowledge an all-existing batch when its required persistence attempt fails',async()=>{
  const existing=existingCatalogFiles();
  const save=vi.fn<SaveFunction>().mockResolvedValue({ok:false,error:'Disk unavailable',code:'IO_ERROR'});
  Object.defineProperty(window,'office',{configurable:true,value:{load:vi.fn().mockResolvedValue(existing),save}});
  render(<App/>);await waitUntilReady();

  let result:EnsureTemplatesResult|undefined;
  await act(async()=>{result=await ensure();});

  expect(save).toHaveBeenCalledOnce();
  expect(save.mock.calls[0][0]).toEqual(existing);
  expect(result).toEqual({ok:false,error:'Disk unavailable'});
  expect(capturedWorkspace().files).toEqual(existing);
 });

 it('persists the current unsaved edit before acknowledging an all-existing batch',async()=>{
  const existing=existingCatalogFiles();
  let finishSave!:(value:SaveResult)=>void;
  const save=vi.fn<SaveFunction>(()=>new Promise<SaveResult>(resolve=>{finishSave=resolve;}));
  Object.defineProperty(window,'office',{configurable:true,value:{load:vi.fn().mockResolvedValue(existing),save}});
  render(<App/>);await waitUntilReady();

  act(()=>capturedWorkspace().onFavorite(existing[0].id));
  await waitFor(()=>expect(capturedWorkspace().files[0].starred).toBe(true));
  let settled=false;let pending!:Promise<EnsureTemplatesResult>;
  act(()=>{pending=ensure().then(value=>{settled=true;return value;});});
  await waitFor(()=>expect(save).toHaveBeenCalledOnce());

  expect(settled).toBe(false);
  const persisted=save.mock.calls[0]?.[0];
  if(!persisted)throw Error('Expected the edited template batch to reach desktop persistence.');
  const editedFile=persisted.find(file=>file.id===existing[0].id);
  if(!editedFile)throw Error('Expected the edited existing file in the persisted batch.');
  expect(editedFile.starred).toBe(true);
  finishSave({ok:true,files:persisted});
  let result:EnsureTemplatesResult|undefined;
  await act(async()=>{result=await pending;});
  expect(result).toMatchObject({ok:true,createdIds:[],existingIds:existing.map(file=>file.id),storage:'desktop-local'});
 });

 it('reuses an individually launched template after a real filename edit and stamps every batch file',async()=>{
  render(<App/>);await waitUntilReady();
  fireEvent.click(screen.getByTestId('launch-tagged-template'));
  const name=await screen.findByRole('textbox',{name:'File name'});
  fireEvent.change(name,{target:{value:'My retained executive audit'}});
  fireEvent.click(screen.getByRole('button',{name:'Back to workspace'}));
  await waitFor(()=>expect(capturedWorkspace().files[0].name).toBe('My retained executive audit'));
  const originalId=capturedWorkspace().files[0].id;

  let first:EnsureTemplatesResult|undefined;await act(async()=>{first=await ensure();});
  const firstSuccess=requireSuccess(first);
  expect(firstSuccess.createdIds).toHaveLength(3);
  expect(firstSuccess.existingIds).toEqual([originalId]);
  expect(firstSuccess.files.every(file=>Boolean(file.templateId))).toBe(true);
  expect(firstSuccess.files.find(file=>file.id===originalId)?.name).toBe('My retained executive audit');

  let second:EnsureTemplatesResult|undefined;await act(async()=>{second=await ensure();});
  expect(requireSuccess(second)).toMatchObject({createdIds:[],existingIds:firstSuccess.files.map(file=>file.id)});
 });

 it('reuses an exact legacy kind and name match without a template id',async()=>{
  const seed=FOLIO_FOUR_IN_ONE_PILLARS[0];
  const legacy:OfficeFile={id:'legacy-exact',kind:seed.kind,name:seed.name,updatedAt:'2026-10-22T00:00:00.000Z',data:structuredClone(seed.data)};
  localStorage.setItem('office-workspace-preview',JSON.stringify([legacy]));render(<App/>);await waitUntilReady();
  let result:EnsureTemplatesResult|undefined;await act(async()=>{result=await ensure();});
  const success=requireSuccess(result);
  expect(success.existingIds).toContain('legacy-exact');
  expect(success.createdIds).toHaveLength(3);
  expect(capturedWorkspace().files.filter(file=>file.kind===seed.kind&&file.name===seed.name)).toHaveLength(1);
 });

 it('deep clones supplied tagged data and refuses ensureTemplates before load completes',async()=>{
  let finishLoad!:(files:OfficeFile[])=>void;const save=vi.fn<SaveFunction>();
  Object.defineProperty(window,'office',{configurable:true,value:{load:vi.fn(()=>new Promise<OfficeFile[]>(resolve=>{finishLoad=resolve;})),save}});
  render(<App/>);
  let early:EnsureTemplatesResult|undefined;await act(async()=>{early=await ensure();});
  expect(early).toEqual({ok:false,error:'Workspace is still opening.'});expect(save).not.toHaveBeenCalled();
  await act(async()=>finishLoad([]));await waitUntilReady();
  const supplied={nested:{value:'original'}};
  act(()=>capturedWorkspace().onCreate('document','Clone check',supplied,'clone-check'));
  supplied.nested.value='changed outside';
  fireEvent.click(await screen.findByRole('button',{name:'Back to workspace'}));
  await waitFor(()=>expect(capturedWorkspace().files.find(file=>file.templateId==='clone-check')?.data).toEqual({nested:{value:'original'}}));
 });

 it('blocks tagged creation during a queued batch while ordinary creation remains available',async()=>{
  let finishSave!:(value:SaveResult)=>void;const save=vi.fn<SaveFunction>(()=>new Promise(resolve=>{finishSave=resolve;}));
  Object.defineProperty(window,'office',{configurable:true,value:{load:vi.fn().mockResolvedValue([]),save}});render(<App/>);await waitUntilReady();
  let pending!:Promise<EnsureTemplatesResult>;act(()=>{pending=ensure();});await waitFor(()=>expect(capturedWorkspace().templateBatchBusy).toBe(true));
  const seed=FOLIO_FOUR_IN_ONE_PILLARS[0];const before=capturedWorkspace().files.length;
  act(()=>capturedWorkspace().onCreate(seed.kind,seed.name,seed.data,seed.templateId));
  expect(capturedWorkspace().files).toHaveLength(before);
  act(()=>capturedWorkspace().onCreate('document','Ordinary note',{html:'<p>Kept</p>'}));
  expect((await screen.findByRole('textbox',{name:'File name'})).getAttribute('value')).toBe('Ordinary note');
  const persisted=save.mock.calls[0][0];finishSave({ok:true,files:persisted});await act(async()=>{await pending;});
 });

 it('awaits a prior ordinary write and keeps busy true until two queued batches finish',async()=>{
  const finishes:Array<(value:SaveResult)=>void>=[];
  const save=vi.fn<SaveFunction>(()=>new Promise(resolve=>finishes.push(resolve)));
  Object.defineProperty(window,'office',{configurable:true,value:{load:vi.fn().mockResolvedValue([]),save}});render(<App/>);await waitUntilReady();
  fireEvent.keyDown(window,{key:'s',ctrlKey:true});
  await waitFor(()=>expect(save).toHaveBeenCalledTimes(1));

  let first!:Promise<EnsureTemplatesResult>;let second!:Promise<EnsureTemplatesResult>;
  act(()=>{first=ensure();second=ensure();});
  await waitFor(()=>expect(capturedWorkspace().templateBatchBusy).toBe(true));
  expect(save).toHaveBeenCalledTimes(1);
  act(()=>capturedWorkspace().onCreate('document','Ordinary file created behind prior write',{html:'<p>Retain me</p>'}));
  fireEvent.click(await screen.findByRole('button',{name:'Back to workspace'}));
  finishes[0]({ok:true,files:save.mock.calls[0][0]});
  await waitFor(()=>expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[1][0].some(file=>file.name==='Ordinary file created behind prior write')).toBe(true);
  finishes[1]({ok:true,files:save.mock.calls[1][0]});
  await act(async()=>{await first;});
  expect(capturedWorkspace().templateBatchBusy).toBe(true);
  const betweenAcks=capturedWorkspace().files.length;const seed=FOLIO_FOUR_IN_ONE_PILLARS[0];
  act(()=>capturedWorkspace().onCreate(seed.kind,seed.name,seed.data,seed.templateId));
  expect(capturedWorkspace().files).toHaveLength(betweenAcks);
  await waitFor(()=>expect(save).toHaveBeenCalledTimes(3));
  finishes[2]({ok:true,files:save.mock.calls[2][0]});
  await act(async()=>{await second;});
  expect(capturedWorkspace().templateBatchBusy).toBe(false);
 });

 it('acknowledges the saved candidate while retaining a rename and favorite made during persistence',async()=>{
  const existing=existingCatalogFiles();let finishSave!:(value:SaveResult)=>void;
  const save=vi.fn<SaveFunction>(()=>new Promise(resolve=>{finishSave=resolve;}));
  Object.defineProperty(window,'office',{configurable:true,value:{load:vi.fn().mockResolvedValue(existing),save}});render(<App/>);await waitUntilReady();
  let pending!:Promise<EnsureTemplatesResult>;act(()=>{pending=ensure();});await waitFor(()=>expect(save).toHaveBeenCalledOnce());
  const savedPayload=structuredClone(save.mock.calls[0][0]);
  act(()=>{capturedWorkspace().onFavorite(existing[0].id);capturedWorkspace().onOpen(existing[0].id);});
  fireEvent.change(await screen.findByRole('textbox',{name:'File name'}),{target:{value:'Renamed after save began'}});
  fireEvent.click(screen.getByRole('button',{name:'Back to workspace'}));
  finishSave({ok:true,files:savedPayload});
  let result:EnsureTemplatesResult|undefined;await act(async()=>{result=await pending;});
  const acknowledged=requireSuccess(result).files.find(file=>file.id===existing[0].id);
  expect(acknowledged).toEqual(savedPayload.find(file=>file.id===existing[0].id));
  expect(capturedWorkspace().files.find(file=>file.id===existing[0].id)).toMatchObject({name:'Renamed after save began',starred:true});
 });
});
