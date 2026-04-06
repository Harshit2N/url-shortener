import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAnalytics, deleteUrl } from '../api/api';
import ClickChart from '../components/ClickChart';

export default function Dashboard() {

  const [searchParams] = useSearchParams();
  const urlId = searchParams.get('id') || '';

  const [shortId,   setShortId]   = useState(urlId);
  const [analytics, setAnalytics] = useState(null);   
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [deleted,   setDeleted]   = useState(false);

  useEffect(() => {
    if (urlId) fetchAnalytics(urlId);
  }, [urlId]);

  async function fetchAnalytics(id) {
    const targetId = id || shortId;
    if (!targetId) return;

    setError('');
    setAnalytics(null);
    setDeleted(false);
    setLoading(true);

    try {
      const data = await getAnalytics(targetId);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirm = window.confirm(`Delete "${shortId}"? This cannot be undone.`);
    if (!confirm) return;

    try {
      await deleteUrl(shortId);
      setDeleted(true);
      setAnalytics(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-10">
          <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            ← Back to Shortener
          </a>
          <h1 className="text-3xl font-bold mt-3">Analytics</h1>
          <p className="text-zinc-400 text-sm mt-1">Enter a short ID to see its click data.</p>
        </div>

        {/* ── Search Bar ── */}
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="Enter short ID  e.g. aB3_xZ9"
            value={shortId}
            onChange={(e) => setShortId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAnalytics()}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3
                       text-sm text-white placeholder-zinc-500
                       focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700
                       text-white font-semibold px-5 rounded-lg text-sm
                       transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Look Up'}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400
                          text-sm rounded-lg px-4 py-3 mb-6">
             {error}
          </div>
        )}

        {/* ── Deleted confirmation ── */}
        {deleted && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400
                          text-sm rounded-lg px-4 py-3 mb-6">
             Short URL deleted successfully.
          </div>
        )}

        {/* ── Analytics Result ── */}
        {analytics && (
          <div className="flex flex-col gap-6">

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 gap-4">

              {/* Total Clicks */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Clicks</p>
                <p className="text-4xl font-bold text-blue-400">{analytics.totalClicks}</p>
              </div>

              {/* Short ID */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Short ID</p>
                <p className="text-2xl font-bold text-white">{analytics.shortId}</p>
              </div>

            </div>

            {/* ── Original URL ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Destination URL</p>
              <a
                href={analytics.longUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm break-all transition-colors"
              >
                {analytics.longUrl}
              </a>
            </div>

            {/* ── Click Chart ── */}
            {/* Only show chart if there are clicks to display */}
            {analytics.history.length > 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Click History</p>
                <ClickChart history={analytics.history} />
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
                <p className="text-zinc-500 text-sm">No clicks recorded yet.</p>
              </div>
            )}

            {/* ── Delete Button ── */}
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-400 transition-colors
                         border border-red-500/20 hover:border-red-500/40
                         rounded-lg py-2 px-4 self-start"
            >
               Delete this short URL
            </button>

          </div>
        )}

      </div>
    </div>
  );
}