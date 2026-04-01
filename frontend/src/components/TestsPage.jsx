import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

function StatusBadge({ status }) {
  if (status === "idle")
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Neleidžiamas</span>;
  if (status === "running")
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 animate-pulse">Vykdoma...</span>;
  if (status === "passed")
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">Pavyko</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Nepavyko</span>;
}

function JsonBlock({ label, data }) {
  if (data == null) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <pre className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState({});
  const [statuses, setStatuses] = useState({});
  const [runningAll, setRunningAll] = useState(false);

  useEffect(() => {
    api.get("/tests").then((r) => {
      setTests(r.data);
      const s = {};
      r.data.forEach((t) => (s[t.id] = "idle"));
      setStatuses(s);
    });
  }, []);

  async function runOne(id) {
    setStatuses((s) => ({ ...s, [id]: "running" }));
    setResults((r) => ({ ...r, [id]: undefined }));
    try {
      const { data } = await api.post(`/tests/run/${id}`);
      setResults((r) => ({ ...r, [id]: data }));
      setStatuses((s) => ({ ...s, [id]: data.passed ? "passed" : "failed" }));
    } catch {
      setStatuses((s) => ({ ...s, [id]: "failed" }));
    }
  }

  async function runAll() {
    setRunningAll(true);
    const s = {};
    tests.forEach((t) => (s[t.id] = "running"));
    setStatuses(s);
    setResults({});
    try {
      const { data } = await api.post("/tests/run");
      const newResults = {};
      const newStatuses = {};
      data.forEach((r) => {
        newResults[r.id] = r;
        newStatuses[r.id] = r.passed ? "passed" : "failed";
      });
      setResults(newResults);
      setStatuses(newStatuses);
    } catch {
      const ns = {};
      tests.forEach((t) => (ns[t.id] = "failed"));
      setStatuses(ns);
    }
    setRunningAll(false);
  }

  const passedCount = Object.values(statuses).filter((s) => s === "passed").length;
  const failedCount = Object.values(statuses).filter((s) => s === "failed").length;
  const total = tests.length;
  const anyRan = passedCount + failedCount > 0;

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">&larr; Žemėlapis</Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Vienetų testai</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} testai &middot; Backend API tikrinimas</p>
          </div>
          <div className="flex items-center gap-4">
            {anyRan && (
              <div className="text-sm text-gray-500">
                <span className="text-emerald-600 font-semibold">{passedCount}</span>
                <span className="mx-1">/</span>
                <span className="font-semibold">{total}</span>
                {failedCount > 0 && (
                  <span className="text-red-500 ml-2">({failedCount} nepavyko)</span>
                )}
              </div>
            )}
            <button
              onClick={runAll}
              disabled={runningAll}
              className="h-9 px-5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 active:bg-black transition-colors disabled:opacity-50"
            >
              {runningAll ? "Vykdoma..." : "Leisti visus"}
            </button>
          </div>
        </div>
      </header>

      {/* Test cards */}
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {tests.map((t, i) => {
          const result = results[t.id];
          const status = statuses[t.id] || "idle";

          return (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Top row */}
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-xs font-mono text-gray-400 tabular-nums">#{i + 1}</span>
                    <h3 className="text-sm font-semibold text-gray-800 truncate">{t.name}</h3>
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.description}</p>
                </div>
                <button
                  onClick={() => runOne(t.id)}
                  disabled={status === "running"}
                  className="ml-4 shrink-0 h-8 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all disabled:opacity-50"
                >
                  Leisti
                </button>
              </div>

              {/* Input / Expected / Actual */}
              <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <JsonBlock label="Įvestis" data={t.input} />
                <JsonBlock label="Laukiamas rezultatas" data={t.expected} />
                {result ? (
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Gautas rezultatas</p>
                    <pre className={`border rounded-lg p-3 text-xs overflow-x-auto leading-relaxed ${
                      result.passed
                        ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                        : "bg-red-50/50 border-red-100 text-red-800"
                    }`}>
                      {JSON.stringify(
                        { status_code: result.actual_status, body: result.actual_body },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Gautas rezultatas</p>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-400 italic">
                      Paleiskite testą, kad pamatytumėte rezultatą.
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
