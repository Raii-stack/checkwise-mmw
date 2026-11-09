import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, BookOpen, Check, CheckCheck, CircleHelp, FileCheck2, FileSpreadsheet, FlaskConical, History as HistoryIcon, Layers3, LoaderCircle, LockKeyhole, ShieldCheck, Upload, X } from 'lucide-react';
import { downloadCsv, HEADERS, MAX_BYTES, sampleCsv } from './lib/csv';
import { saveRun } from './lib/history';
import type { Run } from './lib/validation';
import Results from './components/Results';
import History from './components/History';
import Learn from './components/Learn';

type Page = 'validator' | 'history' | 'learn';
const nav = [{ id: 'validator', label: 'Batch validator', icon: FileCheck2 }, { id: 'history', label: 'Saved history', icon: HistoryIcon }, { id: 'learn', label: 'How it works', icon: BookOpen }] as const;

export default function App() {
  const [page, setPage] = useState<Page>('validator');
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const worker = useRef<Worker | null>(null);
  const currentRunId = useRef<string | undefined>(undefined);
  currentRunId.current = run?.id;

  useEffect(() => () => worker.current?.terminate(), []);

  function validate(file?: File) {
    setError(''); setNotice('');
    if (file) {
      const lower = file.name.toLowerCase();
      const isAllowed = lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls');
      if (!isAllowed || file.size > MAX_BYTES) {
        setError('Choose a .csv or .xlsx file smaller than 2 MB.'); return;
      }
    }
    worker.current?.terminate();
    setBusy(true);
    const task = new Worker(new URL('./validator.worker.ts', import.meta.url), { type: 'module' });
    worker.current = task;
    task.onmessage = (event: MessageEvent<{ run?: Run; error?: string }>) => {
      if (event.data.error) setError(event.data.error);
      else if (event.data.run) { setRun(event.data.run); setSaved(false); setPage('validator'); }
      setBusy(false); task.terminate();
    };
    task.onerror = () => { setError('The batch could not be processed. Please try again.'); setBusy(false); task.terminate(); };
    task.postMessage(file ? { file, name: file.name } : { text: sampleCsv(), name: 'checkwise-sample-1200.csv' });
  }
  async function save() {
    if (!run) return;
    const runId = run.id;
    setSaving(true); setError('');
    try {
      await saveRun(run);
      if (currentRunId.current === runId) { setSaved(true); setNotice('Saved in this browser. Only the summary and flagged records were kept. Export a CSV if you need a backup.'); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save. Your results remain here; you can export or retry.');
    } finally { setSaving(false); }
  }
  const titles = { validator: ['FORENSIC AUDITING WORKSPACE', 'Small digits. Meaningful checks.', 'Review a batch of synthetic invoice identifiers and turn arithmetic into an audit trail.'], history: ['YOUR LOCAL WORKSPACE', 'Every review, within reach.', 'Revisit findings saved on this device, in this browser.'], learn: ['MATHEMATICS IN THE MODERN WORLD', 'The logic behind the last digit.', 'See how modular arithmetic helps catch everyday data-entry errors.'] };
  const stats = [{ label: 'Records checked', value: run?.total_count, icon: Layers3, className: '' }, { label: 'Checksum passed', value: run?.valid_count, icon: ShieldCheck, className: 'green' }, { label: 'Flagged for review', value: run?.flagged_count, icon: FileCheck2, className: 'amber' }, { label: 'Possible transpositions', value: run?.transposition_count, icon: ArrowRight, className: 'purple' }];

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); setPage('validator'); }}><span className="brand-mark"><CheckCheck size={25} /></span><span>checkwise<span className="brand-subtitle">FORENSIC VALIDATOR</span></span></a><div className="nav-caption">WORKSPACE</div><nav aria-label="Main navigation">{nav.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)} aria-current={page === item.id ? 'page' : undefined}><item.icon size={19} />{item.label}{page === item.id && <span className="nav-dot" />}</button>)}</nav><div className="sidebar-bottom"><div className="course-label"><FlaskConical size={19} /><span>Built for curious auditors<small>MMW · 1BSA-ABM2 GROUP 3</small></span></div><div className="sidebar-note"><span className="status-dot" />Learning environment<span>Synthetic records only</span></div></div></aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{nav.find(item => item.id === page)?.label}</strong></div><div className="topbar-right"><span className="local-badge"><span className="status-dot" />Processed in your browser</span><span className="local-only"><LockKeyhole size={14} />Local storage</span></div></header>
    <main><div className="page-heading"><div><div className="eyebrow">{titles[page][0]}</div><h1>{titles[page][1]}</h1><p>{titles[page][2]}</p></div><span className="edition">MMW LAB <span>01</span></span></div>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button className="icon-button" onClick={() => setError('')} aria-label="Dismiss error"><X size={17} /></button></div>}
      {notice && <div className="success-banner" role="status"><Check size={18} />{notice}</div>}
      {page === 'validator' && <>
        <div className="upload-grid"><section className="panel upload-panel"><div className="panel-heading"><div className="step-label"><span>01</span>IMPORT YOUR BATCH</div><h2>A fresh set of records.</h2></div>
          <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!busy && e.dataTransfer.files[0]) validate(e.dataTransfer.files[0]); }}>
            <div className="upload-icon">{busy ? <LoaderCircle className="spin" size={29} /> : <Upload size={29} />}</div><h3>{busy ? 'Checking your records…' : 'Drop your CSV or Excel file here'}</h3><p>{busy ? 'Calculating check digits and looking for possible swaps.' : 'or choose a file from your computer'}</p><button className="button primary" disabled={busy} onClick={() => input.current?.click()}><FileSpreadsheet size={17} />{busy ? 'Processing…' : 'Choose CSV or Excel file'}</button><span className="file-limits">CSV or Excel (.xlsx) · Up to 2 MB · 5,000 records</span>
            <input ref={input} type="file" accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel" className="sr-only" tabIndex={-1} aria-label="Upload CSV or Excel file" onChange={e => { if (e.target.files?.[0]) validate(e.target.files[0]); e.target.value = ''; }} />
          </div><div className="privacy-note"><LockKeyhole size={15} /><span>Your original file stays in your browser. Use synthetic data only.</span></div></section>
          <aside className="sample-panel"><div className="sample-top"><span className="pill"><FlaskConical size={14} />THE PRACTICE DATASET</span><div className="sample-illustration" aria-hidden="true"><div className="paper"><div className="paper-top"><FileSpreadsheet size={19} /><span>INVOICE REGISTER</span></div><div className="paper-row"><i /><i /><span>✓</span></div><div className="paper-row"><i /><i /><span>✓</span></div><div className="paper-row highlighted"><i /><i /><span>!</span></div><div className="paper-row"><i /><i /><span>✓</span></div></div><span className="floating-check"><Check size={22} /></span></div><h2>Start with a little <br />healthy suspicion.</h2><p>1,200 synthetic records. Two methods. <br />A few intentional mistakes to uncover.</p></div><button className="button sample-button" disabled={busy} onClick={() => validate()}>Try sample batch <ArrowRight size={17} /></button><button className="text-button sample-download" onClick={() => downloadCsv(sampleCsv(), 'checkwise-sample-1200.csv')}><ArrowDownToLine size={14} />Download sample CSV</button></aside></div>
        <details className="format-help"><summary><CircleHelp size={16} />What should my file look like?</summary><div><p>Use these three columns in order. Identifier types are <code>luhn</code> or <code>mod11</code>. Keep values as text to preserve leading zeros; include the final check digit. These are demonstration schemes.</p><pre>{`${HEADERS.join(',')}\nDEMO-001,luhn,79927398713\nDEMO-002,mod11,1236`}</pre></div></details>
        <div className="section-divider"><span>YOUR BATCH AT A GLANCE</span><span>{run ? `${Math.round(run.valid_count / run.total_count * 100)}% passed` : 'Ready when you are'}</span></div><div className="stats-grid" aria-live="polite">{stats.map(stat => <div className={`stat-card ${stat.className}`} key={stat.label}><div className="stat-top"><span>{stat.label}</span><stat.icon size={18} /></div><strong>{stat.value === undefined ? '—' : stat.value.toLocaleString()}</strong><span className="stat-caption">{stat.label === 'Possible transpositions' ? 'Included in flagged records' : stat.value === undefined ? 'Awaiting your first batch' : stat.label === 'Checksum passed' ? 'Consistent with the selected rule' : stat.label === 'Flagged for review' ? 'Source verification recommended' : 'Original file not retained'}</span></div>)}</div>
        {run ? <Results key={run.id} run={run} onSave={save} saving={saving} saved={saved} /> : <section className="panel ready-panel"><div className="ready-icon"><FileCheck2 size={25} /></div><div><h3>Your findings will appear here.</h3><p>Upload a batch or try the sample to see which records need a closer look.</p></div><span className="ready-arrow" aria-hidden="true">↗</span></section>}
      </>}
      {page === 'history' && <History onOpen={opened => { worker.current?.terminate(); setBusy(false); setRun(opened); setSaved(true); setPage('validator'); setNotice(''); }} onDelete={id => { if (run?.id === id) setSaved(false); setNotice(''); }} />}
      {page === 'learn' && <Learn />}
      <footer><span><ShieldCheck size={15} />Checksums support judgment. They don’t replace it.</span><span>Checkwise · Mathematics in the Modern World</span></footer>
    </main></div>
  </div>;
}
