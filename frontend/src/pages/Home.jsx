import { useState } from 'react';
import { shortenUrl } from '../api/api';

export default function Home() {

  const [url,       setUrl]       = useState(''); 
  const [alias,     setAlias]     = useState('');      
  const [ttl,       setTtl]       = useState('');    
  const [result,    setResult]    = useState(null);      
  const [error,     setError]     = useState('');     
  const [loading,   setLoading]   = useState(false); 
  const [copied,    setCopied]    = useState(false);  

  async function handleSubmit(e) {
    e.preventDefault();     
    setError('');           
    setResult(null);        
    setLoading(true);

    try {
      const data = await shortenUrl(url, alias, ttl || null);
      setResult(data);     
    } catch (err) {
      setError(err.message); 
    } finally {
      setLoading(false);     
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">

      {/* ── Header ── */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">Snip URL</h1>
        <p className="text-zinc-400 mt-2 text-sm">Shorten long links. Track every click.</p>
      </div>

      {/* ── Form Card ── */}
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Long URL — required */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-widest">Long URL</label>
            <input
              type="url"
              placeholder="https://your-very-long-url.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3
                         text-sm text-white placeholder-zinc-500
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Custom Alias — optional */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-widest">
              Custom Alias <span className="normal-case text-zinc-600">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. my-link"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3
                         text-sm text-white placeholder-zinc-500
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* TTL / Expiry — optional */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-widest">
              Expires In <span className="normal-case text-zinc-600">(optional, in seconds)</span>
            </label>
            <select
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3
                         text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Never</option>
              <option value="3600">1 Hour</option>
              <option value="86400">1 Day</option>
              <option value="604800">1 Week</option>
              <option value="2592000">1 Month</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700
                       text-white font-semibold rounded-lg py-3 text-sm
                       transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Shortening...' : 'Shorten URL'}
          </button>

        </form>

        {/* ── Error Message ── */}
        {/* Only renders if error string is not empty */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400
                          text-sm rounded-lg px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        {/* ── Result Box ── */}
        {/* Only renders after a successful API response */}
        {result && (
          <div className="mt-6 bg-zinc-800 border border-zinc-700 rounded-xl p-5">

            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Your Short Link</p>

            {/* Short URL + Copy button */}
            <div className="flex items-center gap-2">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium text-sm truncate flex-1 transition-colors"
              >
                {result.shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white
                           px-3 py-1.5 rounded-md transition-colors shrink-0"
              >
                {copied ? '✅ Copied!' : 'Copy'}
              </button>
            </div>

            {/* Original URL preview */}
            <p className="mt-3 text-xs text-zinc-500 truncate">
              → {result.longUrl}
            </p>

            {/* Expiry info */}
            {result.expiresIn && (
              <p className="mt-1 text-xs text-yellow-500/70">
                ⏱ Expires in {result.expiresIn}
              </p>
            )}

            {/* Link to analytics page */}
            <a
              href={`/dashboard?id=${result.shortId}`}
              className="mt-4 inline-block text-xs text-zinc-400 hover:text-white transition-colors"
            >
              📊 View Analytics →
            </a>

          </div>
        )}

      </div>

      {/* ── Footer link to dashboard ── */}
      <a href="/dashboard" className="mt-8 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
        View Analytics Dashboard →
      </a>

    </div>
  );
}