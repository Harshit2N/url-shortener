import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home      from './pages/Home';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={
          <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl mb-4">404</p>
              <p className="text-zinc-400 mb-6">Page not found.</p>
              <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                ← Go Home
              </a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}