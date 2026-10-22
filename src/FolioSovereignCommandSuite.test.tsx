// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi}from'vitest';
import {cleanup,fireEvent,render,screen,within}from'@testing-library/react';
import {FormulaEngine}from'../shared/formulas.mjs';
import FolioSovereignCommandSuite,{FOLIO_COMMAND_WORKSPACES,FOLIO_NATIVE_PRESETS}from'./FolioSovereignCommandSuite';

afterEach(cleanup);

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

 it('renders the zero-rent annual tax killer strip, tactile four-in-one workspace deck, and 100% on-device local AI workbench',()=>{
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
  expect(onCreate).toHaveBeenCalledWith('notebook','Research & Engineering Notebook',expect.any(Object));
  fireEvent.click(screen.getByTestId('copy-four-in-one-sovereign-receipt-btn'));
  expect(onCreate).toHaveBeenCalledWith('document','Executive Client Audit Document',expect.any(Object));
  expect(onCreate).toHaveBeenCalledWith('spreadsheet','Live Formula & Margin Spreadsheet',expect.any(Object));
  expect(onCreate).toHaveBeenCalledWith('presentation','Board Pitch Presentation Deck',expect.any(Object));

  expect(screen.getByTestId('private-local-ai-assistant-workbench')).toBeTruthy();
  fireEvent.click(screen.getByTestId('local-ai-task-pill-presentation-deck'));
  expect(screen.getByTestId('local-ai-execution-output').textContent).toContain('127.0.0.1:11434');
  fireEvent.click(screen.getByTestId('local-ai-apply-to-file-btn'));
  expect(onCreate).toHaveBeenCalledWith('presentation','3-Bullet Board Narrative Deck',expect.any(Object));
 });
});
