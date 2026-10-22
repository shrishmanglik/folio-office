// @vitest-environment jsdom
import {act,cleanup,render,waitFor}from'@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi}from'vitest';
import App from'./App';
import {FOLIO_FOUR_IN_ONE_PILLARS}from'./FolioSovereignCommandSuite';
import type{ComponentProps}from'react';
import type WorkspaceComponent from'./Workspace';
import type{EnsureTemplatesResult,OfficeFile}from'./types';

type CapturedWorkspaceProps=Pick<ComponentProps<typeof WorkspaceComponent>,'files'|'ready'|'onEnsureTemplates'|'onFavorite'>;
const workspace=vi.hoisted(()=>({props:null as CapturedWorkspaceProps|null}));
vi.mock('./Workspace',()=>({default:(props:CapturedWorkspaceProps)=>{workspace.props=props;return <output data-testid="workspace-file-count">{props.files.length}</output>;}}));

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
});
