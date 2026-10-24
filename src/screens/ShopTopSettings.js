import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Store, Trash2 } from 'lucide-react';
import { API_URL } from '../lib/api';

const SHOP_TOP_API_URL = `${API_URL}/shops`;

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error('The server returned an invalid response.');
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${SHOP_TOP_API_URL}${path}`, {
    ...options,
    headers: {
      'bypass-tunnel-reminder': 'true',
      ...(options.headers || {}),
    },
  });
  const data = await readJsonResponse(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'The request could not be completed.');
  }
  return data;
}

export default function ShopTopSettings() {
  const [shops, setShops] = useState([]);
  const [topSettings, setTopSettings] = useState([]);
  const [search, setSearch] = useState('');
  const [priorities, setPriorities] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadShops = useCallback(async () => {
    setError('');
    try {
      const data = await request('/top-settings');
      setShops(Array.isArray(data.shops) ? data.shops : []);
      setTopSettings(Array.isArray(data.topSettings) ? data.topSettings : []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load shop settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const topShops = useMemo(
    () => topSettings
      .filter(setting => setting.isActive && setting.shopId)
      .slice()
      .sort((left, right) => Number(left.priority) - Number(right.priority)),
    [topSettings]
  );
  const topByShopId = useMemo(
    () => new Map(topShops.map(setting => [String(setting.shopId?._id || setting.shopId), setting])),
    [topShops]
  );
  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase();
    return shops.filter(shop =>
      !query ||
      String(shop.shopName || '').toLowerCase().includes(query) ||
      String(shop.ownerName || '').toLowerCase().includes(query)
    );
  }, [search, shops]);

  const updateTopShop = async (shop, existingSetting) => {
    const shopId = String(shop._id);
    setBusyId(shopId);
    setError('');
    setNotice('');
    try {
      const path = existingSetting ? '/remove-top' : '/set-top';
      const body = existingSetting
        ? { shopId }
        : { shopId, priority: Number(priorities[shopId] ?? ((topShops.length + 1) * 10)) };
      await request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setNotice(existingSetting ? 'Shop removed from TOP.' : 'Shop added to TOP.');
      await loadShops();
    } catch (actionError) {
      setError(actionError.message || 'Could not update TOP shops.');
    } finally {
      setBusyId('');
    }
  };

  const clearAll = async () => {
    if (!topShops.length || !window.confirm('Remove all shops from TOP?')) return;
    setBusyId('clear-all');
    setError('');
    setNotice('');
    try {
      await request('/clear-all-top', { method: 'POST' });
      setNotice('All TOP shops have been removed.');
      await loadShops();
    } catch (actionError) {
      setError(actionError.message || 'Could not clear TOP shops.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <main className="min-h-screen space-y-6 p-4 text-slate-100 sm:p-6">
      <header className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Shop Top Settings</h1>
            <p className="mt-2 text-sm text-slate-300">
              Jis shop ko TOP par add karoge uske products top par ayenge
            </p>
          </div>
          <button
            type="button"
            onClick={clearAll}
            disabled={!topShops.length || busyId !== ''}
            className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} /> Clear all TOP
          </button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-950/50 p-3 text-sm text-emerald-200">{notice}</p>}

      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">TOP shops</h2>
            <p className="text-sm text-slate-400">Products appear in priority order.</p>
          </div>
          <span className="rounded-full bg-lime-400/10 px-3 py-1 text-sm font-semibold text-lime-300">{topShops.length}</span>
        </div>
        {topShops.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">No shops have been added to TOP yet.</p>
        ) : (
          <div className="space-y-2">
            {topShops.map(setting => {
              const shop = setting.shopId && typeof setting.shopId === 'object' ? setting.shopId : null;
              const shopId = String(shop?._id || setting.shopId);
              return (
                <div key={shopId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-lime-400/10 font-bold text-lime-300">{setting.priority}</span>
                    <div>
                      <p className="font-semibold">{shop?.shopName || 'Shop'}</p>
                      <p className="text-sm text-slate-400">{shop?.ownerName || 'Owner details unavailable'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => shop && updateTopShop(shop, setting)}
                    disabled={busyId !== ''}
                    className="rounded-lg border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Remove TOP
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">All shops</h2>
            <p className="text-sm text-slate-400">Search by shop name or owner name.</p>
          </div>
          <label className="flex min-w-56 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search shops..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </label>
        </div>
        {loading ? (
          <p className="py-8 text-center text-slate-400">Loading shops...</p>
        ) : filteredShops.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">
            {shops.length ? 'No shops match your search.' : 'No shops found.'}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredShops.map(shop => {
              const shopId = String(shop._id);
              const setting = topByShopId.get(shopId);
              return (
                <article key={shopId} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-700 text-lime-300"><Store size={19} /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{shop.shopName || 'Unnamed shop'}</h3>
                      <p className="truncate text-sm text-slate-400">{shop.ownerName || 'Owner name unavailable'}</p>
                      {setting && <p className="mt-2 text-xs font-semibold text-lime-300">TOP priority: {setting.priority}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {!setting && (
                      <input
                        type="number"
                        min="0"
                        value={priorities[shopId] ?? ((topShops.length + 1) * 10)}
                        onChange={event => setPriorities(current => ({ ...current, [shopId]: event.target.value }))}
                        aria-label={`Priority for ${shop.shopName || 'shop'}`}
                        className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-lime-400"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => updateTopShop(shop, setting)}
                      disabled={busyId !== ''}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        setting ? 'border border-red-400/40 text-red-200 hover:bg-red-500/10' : 'bg-lime-400 text-slate-950 hover:bg-lime-300'
                      }`}
                    >
                      {setting ? 'Remove TOP' : 'Add to TOP'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
