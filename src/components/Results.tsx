import { useState } from 'react';
import { AlertTriangle, ArrowDownToLine, Check, ChevronLeft, ChevronRight, Search, ShieldCheck } from 'lucide-react';
import type { FindingCode, Run } from '../lib/validation';
import { downloadCsv, reportCsv } from '../lib/csv';

export const findingLabels: Record<FindingCode, string> = { invalid_format: 'Invalid format', checksum_failed: 'Checksum failed', possible_transposition: 'Possible transposition' };

export default function Results({ run, onSave, saving, saved }: { run: Run; onSave: () => void; saving: boolean; saved: boolean }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rows = run.errors.filter(row => (filter === 'all' || row.code === filter) && `${row.invoice_id} ${row.identifier_value}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(rows.length / 10));
  const current = Math.min(page, pageCount - 1);
  return <section className="panel results" aria-labelledby="results-title">
    <div className="panel-heading results-heading"><div><div className="eyebrow">BATCH FINDINGS</div><h2 id="results-title">Review the exceptions <span className="count-badge">{run.flagged_count}</span></h2><p className="muted filename">{run.file_name} · {new Date(run.created_at).toLocaleString()}</p></div><div className="actions">
      <button className="button" disabled={saving || saved} onClick={onSave}>{saved ? <Check size={16} /> : <ShieldCheck size={16} />}{saved ? 'Saved in browser' : saving ? 'Saving…' : 'Save run'}</button>
      <button className="button primary" onClick={() => downloadCsv(reportCsv(run), `checkwise-errors-${run.id.slice(0, 8)}.csv`)}><ArrowDownToLine size={16} />Export errors</button>
    </div></div>
    {run.flagged_count > 0 ? <>
      <div className="table-toolbar"><label className="search-field"><Search size={17} /><span className="sr-only">Search flagged records</span><input value={search} placeholder="Search invoice or identifier…" onChange={e => { setSearch(e.target.value); setPage(0); }} /></label><label className="filter-label"><span className="sr-only">Filter findings</span><select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="all">All findings</option>{Object.entries(findingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      <div className="table-scroll"><table><thead><tr><th>Record</th><th>Invoice / identifier</th><th>Method</th><th>Finding</th><th>Review note</th></tr></thead><tbody>{rows.slice(current * 10, current * 10 + 10).map(row => <tr key={row.row_number}><td className="mono muted">{String(row.row_number).padStart(3, '0')}</td><td><strong>{row.invoice_id || 'Missing invoice ID'}</strong><span className="mono cell-value">{row.identifier_value || '(empty)'}</span></td><td><span className="method-tag">{row.identifier_type === 'luhn' ? 'Luhn · 10' : row.identifier_type === 'mod11' ? 'Mod · 11' : row.identifier_type || 'Missing'}</span></td><td><span className={`finding ${row.code}`}><span />{findingLabels[row.code]}</span></td><td className="review-note">{row.message}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty compact">No flagged records match this search.</div>}</div>
      <div className="table-footer"><span>{rows.length ? `${current * 10 + 1}–${Math.min((current + 1) * 10, rows.length)} of ${rows.length} flagged records` : '0 matching records'}</span><div className="actions"><button className="icon-button" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft size={18} /></button><span>{current + 1} / {pageCount}</span><button className="icon-button" aria-label="Next page" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}><ChevronRight size={18} /></button></div></div>
      <div className="report-note"><AlertTriangle size={16} /><span>A passing swap suggests a possible cause. Check against your source record before making corrections. Record numbers count CSV entries, including the header.</span></div>
    </> : <div className="empty"><div className="success-icon"><Check size={26} /></div><h3>Every check digit passed.</h3><p>This confirms checksum consistency, not the authenticity of an invoice or identity.</p></div>}
  </section>;
}
