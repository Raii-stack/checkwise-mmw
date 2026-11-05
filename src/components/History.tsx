import { useEffect, useState } from 'react';
import { ArrowUpRight, History as HistoryIcon, Trash2 } from 'lucide-react';
import { deleteRun, getRun, listRuns } from '../lib/history';
import type { Run, RunSummary } from '../lib/validation';

export default function History({ onOpen, onDelete }: { onOpen: (run: Run) => void; onDelete: (id: string) => void }) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    listRuns(page).then(result => {
      if (active) { setRuns(result.runs); setHasMore(result.hasMore); }
    }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision]);

  async function open(id: string) {
    setBusy(id); setError('');
    try { onOpen(await getRun(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not open this run.'); }
    finally { setBusy(''); }
  }
  async function remove(id: string) {
    if (!confirm('Delete this saved run and all its flagged records? This cannot be undone.')) return;
    setBusy(id); setError('');
    try { await deleteRun(id); onDelete(id); setRevision(value => value + 1); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this run.'); }
    finally { setBusy(''); }
  }
  return <section className="panel"><div className="panel-heading"><div className="eyebrow">SAVED IN THIS BROWSER</div><h2>Saved batches</h2><p className="muted">Only summaries and flagged records are kept. History is shared by anyone using this browser profile and is lost if browser data is cleared.</p></div>
    {error && <p className="error-message inset" role="alert">{error}</p>}
    {loading ? <p className="empty" role="status">Loading your history…</p> : runs.length === 0 ? <div className="empty"><HistoryIcon size={32} /><h3>No saved runs yet.</h3><p>Validate a batch, then choose “Save run” to keep its findings in this browser.</p></div> : <div className="history-list">{runs.map(run => <article className="history-row" key={run.id}><div><h3>{run.file_name}</h3><p>{new Date(run.created_at).toLocaleString()} · {run.total_count.toLocaleString()} records · {run.flagged_count} flagged</p></div><div className="actions"><button className="button" disabled={!!busy} onClick={() => open(run.id)}>Open report<ArrowUpRight size={16} /></button><button className="icon-button" aria-label={`Delete ${run.file_name}`} disabled={!!busy} onClick={() => remove(run.id)}><Trash2 size={17} /></button></div></article>)}</div>}
    {(page > 0 || hasMore) && <div className="table-footer"><button className="button" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1}</span><button className="button" disabled={!hasMore || loading} onClick={() => setPage(page + 1)}>Next</button></div>}
  </section>;
}
