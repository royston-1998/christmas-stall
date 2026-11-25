import { useState, useEffect } from 'react';
import { Lock, Search, Plus, Minus, CheckCircle2, LogOut, RefreshCw, Package } from 'lucide-react';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('stall_admin_token') || '');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const fetchInventory = async (authToken = token) => {
    setLoading(true);
    const res = await fetch('/api/catalog', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.status === 401) {
      handleLogout();
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchInventory(token);
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || 'Login failed');
      return;
    }
    localStorage.setItem('stall_admin_token', data.token);
    setToken(data.token);
    setPassword('');
  };

  const handleLogout = () => {
    localStorage.removeItem('stall_admin_token');
    setToken('');
    setCart({});
  };

  const updateCart = (item, delta) => {
    setCart((prev) => {
      const current = prev[item.id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      if (next > item.stock) return prev; // Prevent exceeding live stock
      return { ...prev, [item.id]: next };
    });
  };

  const handleProceed = async () => {
    const cartPayload = Object.entries(cart).map(([id, qty]) => ({ id, qty }));
    if (!cartPayload.length) return;

    setSubmitting(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cart: cartPayload, customerName }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      alert(data.error || 'Error updating stock');
      return;
    }

    setPopupMessage(data.message);
    setCart({});
    setCustomerName('');
    fetchInventory(token);
  };

  // 1. Login Screen when unauthenticated
  if (!token) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4"
        >
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-center text-stone-900">Stall Admin Access</h2>
          {authError && <p className="text-xs text-red-600 text-center">{authError}</p>}
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700"
            required
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-red-800 hover:bg-red-900 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            Unlock Inventory
          </button>
        </form>
      </div>
    );
  }

  const cartEntries = Object.entries(cart).map(([id, qty]) => {
    const item = items.find((i) => i.id === id);
    return { ...item, qty };
  });

  const totalUnits = cartEntries.reduce((sum, i) => sum + i.qty, 0);
  const totalAmount = cartEntries.reduce((sum, i) => sum + (i?.price || 0) * i.qty, 0);
  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase())
  );

  // 2. Authenticated Admin POS & Stock Deduction Dashboard
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* Top Bar */}
      <header className="bg-stone-900 text-white px-4 py-3.5 sticky top-0 z-30 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Stall Stock & Quick Checkout</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchInventory()}
              className="p-2 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer"
              title="Sync with Google Sheets"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clear Inventory Panel: First on mobile, right sticky column on desktop */}
        <div className="order-first lg:order-last bg-white rounded-2xl border border-stone-200 p-5 h-fit lg:sticky lg:top-20 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-lg">Clear Inventory</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
              {totalUnits} item(s)
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Customer Name (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank for Walk-in"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
            />
          </div>

          {cartEntries.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">
              Select items below to deduct from stock.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cartEntries.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="truncate">
                    {item.qty}x {item.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold">₹{item.price * item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateCart(item, -1)}
                      className="p-1 rounded bg-stone-100 hover:bg-stone-200 cursor-pointer"
                      title="Remove one"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-stone-100 pt-3 flex justify-between items-center">
            <span className="text-sm text-stone-500">Reference Total</span>
            <span className="text-xl font-bold text-stone-900">₹{totalAmount}</span>
          </div>

          <button
            disabled={cartEntries.length === 0 || submitting}
            onClick={handleProceed}
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-semibold transition cursor-pointer"
          >
            {submitting ? 'Updating Google Sheet...' : 'Proceed & Clear Stock'}
          </button>
        </div>

        {/* Item Lookup & Stock List */}
        <div className="order-last lg:order-first lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search item name or ID to check price & stock..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((item) => {
              const selectedQty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`bg-white p-4 rounded-xl border transition flex items-center justify-between ${
                    selectedQty > 0 ? 'border-red-700 ring-1 ring-red-700' : 'border-stone-200'
                  }`}
                >
                  <div className="pr-3">
                    <span className="text-[11px] font-mono text-stone-400">{item.id}</span>
                    <h4 className="font-semibold text-stone-900">{item.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="font-bold text-emerald-800">₹{item.price}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.stock > 3
                            ? 'bg-stone-100 text-stone-700'
                            : item.stock > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        Stock: {item.stock}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={selectedQty === 0}
                      onClick={() => updateCart(item, -1)}
                      className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-bold">{selectedQty}</span>
                    <button
                      disabled={item.stock === 0 || selectedQty >= item.stock}
                      onClick={() => updateCart(item, 1)}
                      className="p-2 rounded-lg bg-red-800 text-white hover:bg-red-900 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Thank You Confirmation Popup */}
      {popupMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-bold text-stone-900">{popupMessage}</h3>
            <p className="text-sm text-stone-500">
              Inventory has been deducted and logged to Google Sheets.
            </p>
            <button
              onClick={() => setPopupMessage('')}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
