import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import DOMPurify from 'dompurify';
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel } from 'docx';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, ImagePlus, Table2, Printer, Upload, Download, Quote, Minus, PanelLeft, Maximize2, Minimize2, FileText } from 'lucide-react';
import type { EditorProps } from '../types';
import { downloadFile } from '../io';
import './DocumentEditor.css';

function docxBlocks(nodes: any[]): (Paragraph | Table)[] {
  const runs = (node: any, inherited: any = {}): TextRun[] => {
    const style = { ...inherited };
    for (const mark of node.marks || []) {
      if (mark.type === 'bold') style.bold = true;
      if (mark.type === 'italic') style.italics = true;
      if (mark.type === 'underline') style.underline = {};
      if (mark.type === 'strike') style.strike = true;
      if (mark.type === 'code') style.font = 'Consolas';
    }
    if (node.type === 'text') return [new TextRun({ text: node.text, ...style })];
    if (node.type === 'hardBreak') return [new TextRun({ break: 1 })];
    if (node.type === 'image') return [new TextRun({ text: '[Image: ' + (node.attrs?.alt || 'embedded image') + ']' })];
    return (node.content || []).flatMap((n: any) => runs(n, style));
  };
  return nodes.flatMap((node): (Paragraph | Table)[] => {
    if (node.type === 'table') return [new Table({ rows: (node.content || []).map((row: any) => new TableRow({ children: (row.content || []).map((cell: any) => new TableCell({ children: docxBlocks(cell.content || []) })) })) })];
    if (node.type === 'bulletList' || node.type === 'orderedList') return (node.content || []).map((item: any, i: number) => new Paragraph({ children: node.type === 'orderedList' ? [new TextRun(`${i + (node.attrs?.start || 1)}. `), ...runs(item)] : runs(item), ...(node.type === 'bulletList' ? { bullet: { level: 0 } } : {}) }));
    if (node.type === 'blockquote') return docxBlocks(node.content || []);
    const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
    return [new Paragraph({ children: runs(node), ...(node.type === 'heading' ? { heading: levels[(node.attrs?.level || 1) - 1] } : {}), ...(node.attrs?.textAlign ? { alignment: node.attrs.textAlign } : {}), spacing: { after: 160 } })];
  });
}

export default function DocumentEditor({ file, onChange }: EditorProps) {
  const updateRef = useRef(onChange); updateRef.current = onChange;
  const importRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, TableKit.configure({ table: { resizable: true } }), Image.configure({ allowBase64: true }), TextAlign.configure({ types: ['heading', 'paragraph'] })],
    content: file.data?.content || file.data?.html || '<p></p>',
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { 'aria-label': 'Document content', spellcheck: 'true' } },
    onUpdate: ({ editor: current }) => updateRef.current({ content: current.getJSON() }),
  });
  const previousId = useRef(file.id);
  useEffect(() => { if (editor && (previousId.current !== file.id || (file.data?.content && JSON.stringify(editor.getJSON()) !== JSON.stringify(file.data.content)))) { previousId.current = file.id; editor.commands.setContent(file.data?.content || file.data?.html || '<p></p>', { emitUpdate: false }); setNotice(''); } }, [file.id, editor, file.data]);
  if (!editor) return null;
  const action = async (run: () => Promise<void>) => { setBusy(true); setNotice(''); try { await run(); } catch (error) { setNotice(error instanceof Error ? error.message : 'The file could not be processed.'); } finally { setBusy(false); } };
  const exportAs = (format: string) => action(async () => {
    if(window.office){const result=await window.office.convertExport({...file,data:{content:editor.getJSON()}},format);setNotice(result.cancelled?'Export cancelled.':result.ok?(result.warnings?.join(' ')||'Exported successfully.'):result.error||'Export failed.');return;}
    if (format === 'docx') {
      await downloadFile(file.name, await Packer.toBlob(new Document({ sections: [{ children: docxBlocks(editor.getJSON().content || []) }] })), 'docx');
      setNotice('DOCX exported with basic formatting. Images become captions; use HTML to preserve embedded images.');
    } else if (format === 'html') await downloadFile(file.name, '<!doctype html><html><head><meta charset="utf-8"><title>Document</title><style>body{max-width:760px;margin:50px auto;font:16px/1.6 Georgia}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px}img{max-width:100%}</style></head><body>' + editor.getHTML() + '</body></html>', 'html', 'text/html');
    else await downloadFile(file.name, editor.getText(), 'txt', 'text/plain');
  });
  const tool = (label: string, Icon: any, click: () => void, active = false, disabled = false) => <button type="button" className={active ? 'is-active' : ''} title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={click}><Icon size={17} /></button>;
  const words = editor.getText().trim().split(/\s+/).filter(Boolean).length;
  const headings: { text: string; level: number; position: number }[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'heading') headings.push({ text: node.textContent || 'Untitled heading', level: node.attrs.level, position });
  });
  const activeHeading = headings.filter(heading => heading.position <= editor.state.selection.from).at(-1)?.position;
  const jumpToHeading = (position: number) => {
    editor.chain().focus().setTextSelection(position + 1).scrollIntoView().run();
    const element = editor.view.nodeDOM(position);
    if (element instanceof HTMLElement) element.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  return <div className={`document-editor${focusMode ? ' doc-focus-mode' : ''}`}>
    <div className="doc-viewbar">
      <div className="doc-view-title"><FileText size={17} /><span>Document</span><span className="doc-view-detail">Writing workspace</span></div>
      <div className="doc-view-actions"><button aria-label="Toggle document outline" aria-controls="document-outline" aria-expanded={outlineOpen && !focusMode} onClick={() => { setOutlineOpen(!outlineOpen || focusMode); setFocusMode(false); }} className={outlineOpen && !focusMode ? 'is-active' : ''}><PanelLeft size={15} /> Outline</button><button aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'} aria-pressed={focusMode} onClick={() => setFocusMode(!focusMode)}>{focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {focusMode ? 'Exit focus' : 'Focus'}</button></div>
    </div>
    <div className="doc-toolbar" role="toolbar" aria-label="Document formatting">
      <div className="doc-tool-group" role="group" aria-label="History" data-label="History">{tool('Undo', Undo2, () => editor.chain().focus().undo().run(), false, !editor.can().undo())}{tool('Redo', Redo2, () => editor.chain().focus().redo().run(), false, !editor.can().redo())}</div>
      <div className="doc-tool-group" role="group" aria-label="Text style" data-label="Text style"><select aria-label="Text style" value={editor.isActive('heading') ? String(editor.getAttributes('heading').level) : '0'} onChange={e => { const level = Number(e.target.value); if (level) editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run(); else editor.chain().focus().setParagraph().run(); }}><option value="0">Normal text</option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option></select></div>
      <div className="doc-tool-group" role="group" aria-label="Format" data-label="Format">{tool('Bold · Ctrl+B', Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}{tool('Italic · Ctrl+I', Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}{tool('Underline · Ctrl+U', Underline, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}</div>
      <div className="doc-tool-group" role="group" aria-label="Alignment" data-label="Alignment">{tool('Align left', AlignLeft, () => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }))}{tool('Align center', AlignCenter, () => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }))}{tool('Align right', AlignRight, () => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }))}</div>
      <div className="doc-tool-group" role="group" aria-label="Structure" data-label="Structure">{tool('Bulleted list', List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}{tool('Numbered list', ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}{tool('Quote', Quote, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}{tool('Divider', Minus, () => editor.chain().focus().setHorizontalRule().run())}</div>
      <div className="doc-tool-group" role="group" aria-label="Insert" data-label="Insert">{tool('Insert table', Table2, () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}{tool('Insert local image', ImagePlus, () => imageRef.current?.click())}</div>
      <div className="doc-tool-group doc-file-tools" role="group" aria-label="File actions" data-label="File"><button disabled={busy} onClick={() => importRef.current?.click()}><Upload size={16} /> Import</button><label className="doc-export"><Download size={16}/><select aria-label="Export document" value="" disabled={busy} onChange={e => { if (e.target.value) void exportAs(e.target.value); }}><option value="" disabled>Export</option><option value="docx">Word (.docx)</option><option value="html">Web page (.html)</option><option value="txt">Plain text (.txt)</option></select></label>{tool('Print / Save PDF', Printer, () => { if (window.office) void window.office.print().catch(e => setNotice(String(e))); else window.print(); })}</div>
    </div>
    {editor.isActive('table') && <div className="doc-table-tools"><span>Table</span><button onClick={() => editor.chain().focus().addRowAfter().run()}>Add row</button><button onClick={() => editor.chain().focus().addColumnAfter().run()}>Add column</button><button onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</button><button onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</button><button onClick={() => editor.chain().focus().deleteTable().run()}>Remove table</button></div>}
    {notice && <div className="doc-notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
    <div className="doc-workspace">
      {outlineOpen && !focusMode && <aside className="doc-outline" id="document-outline" aria-label="Document outline"><div className="doc-outline-title">On this page <span>{headings.length}</span></div><p className="doc-outline-caption">Your document at a glance</p><nav aria-label="Document headings">{headings.length ? headings.map(heading => <button key={heading.position} className={activeHeading === heading.position ? 'is-active' : ''} aria-current={activeHeading === heading.position ? 'location' : undefined} style={{ paddingLeft: 10 + (heading.level - 1) * 12 }} onClick={() => jumpToHeading(heading.position)}><span className="doc-heading-marker" />{heading.text}</button>) : <div className="doc-outline-empty"><List size={23} /><strong>Give your ideas structure</strong><p>Choose Heading 1, 2 or 3 from Text style. Your sections will appear here.</p></div>}</nav><div className="doc-outline-summary"><span>{words.toLocaleString()} words</span><span>{Math.max(1, Math.ceil(words / 200))} min read</span></div></aside>}
      <div className="doc-canvas"><div className="doc-ruler" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div><div className="doc-paper" style={{ zoom: zoom / 100 }}><EditorContent editor={editor}/></div><div className="doc-page-end" aria-hidden="true">End of document</div></div></div>
    <footer className="doc-status"><span>{words.toLocaleString()} {words === 1 ? 'word' : 'words'}<i />{editor.getText().length.toLocaleString()} characters</span><span><span className="doc-local-indicator" /> Offline editing <i/><button aria-label="Zoom out" onClick={() => setZoom(z => Math.max(50, z - 10))}>−</button><span>{zoom}%</span><button aria-label="Zoom in" onClick={() => setZoom(z => Math.min(150, z + 10))}>+</button></span></footer>
    <input ref={imageRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={e => { const image = e.target.files?.[0]; e.target.value = ''; if (!image) return; void action(async () => { if (image.size > 15 * 1024 * 1024) throw new Error('Choose an image smaller than 15 MB.'); const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(image); }); editor.chain().focus().setImage({ src: data, alt: image.name }).run(); }); }}/>
    <input ref={importRef} type="file" accept=".docx,.html,.htm,.txt" hidden onChange={e => { const input = e.target.files?.[0]; e.target.value = ''; if (!input) return; void action(async () => { if (!editor.isEmpty && !window.confirm('Replace the current document with this file?')) return; if(window.office){const result=await window.office.convertImport(input.name,Array.from(new Uint8Array(await input.arrayBuffer())),'document');editor.commands.setContent(result.data.content||result.data.html);setNotice(result.warnings.join(' ')||'Imported successfully.');return;} if (input.size > 30 * 1024 * 1024) throw new Error('Choose a document smaller than 30 MB.'); if (/\.docx$/i.test(input.name)) { const result = await mammoth.convertToHtml({ arrayBuffer: await input.arrayBuffer() }); editor.commands.setContent(DOMPurify.sanitize(result.value)); setNotice('DOCX imported. Check layout and unsupported formatting before exporting.'); } else if (/\.html?$/i.test(input.name)) { const safe = DOMPurify.sanitize(await input.text()); const parsed = new DOMParser().parseFromString(safe, 'text/html'); parsed.querySelectorAll('img').forEach(img => { if (!img.getAttribute('src')?.startsWith('data:image/')) img.remove(); }); editor.commands.setContent(parsed.body.innerHTML); } else { editor.commands.setContent({ type: 'doc', content: (await input.text()).split(/\r?\n/).map(text => ({ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) })) }); } }); }}/>
  </div>;
}
