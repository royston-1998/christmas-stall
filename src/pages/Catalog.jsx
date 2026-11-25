import { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Minus, Send, Sparkles } from 'lucide-react';

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [wishlist, setWishlist] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/catalog')
      .then((res) => res.json())
      .then((data) => {
        const fetched = data.items || [];
        setItems(fetched);

        // Clamp any existing selections if stock changed
        const stockMap = Object.fromEntries(
          fetched.map((i) => [i.id, Math.max(0, Number(i.available_stock) || 0)])
        );
        setWishlist((prev) => {
          const next = {};
          for (const [id, q] of Object.entries(prev)) {
            const cap = stockMap[id] ?? 0;
            if (cap > 0) next[id] = Math.min(q, cap);
          }
          return next;
        });

        setLoading(false);
      });
  }, []);

  const updateQty = (id, delta, maxStock) => {
    const cap = Math.max(0, Number(maxStock) || 0);
    if (cap <= 0) return;

    setWishlist((prev) => {
      const current = Math.min(prev[id] || 0, cap);
      const next = current + delta;

      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }

      // Do not exceed available stock
      const clamped = Math.min(next, cap);
      return { ...prev, [id]: clamped };
    });
  };

  const selectedCount = Object.values(wishlist).reduce((a, b) => a + b, 0);

  const sendOrderInquiry = () => {
    const lines = Object.entries(wishlist).map(([id, qty]) => {
      const item = items.find((i) => String(i.id) === String(id));
      const itemId = item?.id ?? id;
      const itemName = item?.name ?? 'Item';
      return `•  [ID: ${itemId}] - ${itemName} - ${qty} qty`;
    });
    const text = encodeURIComponent(
      `Merry Christmas! I'd like to inquire/order these items from the stall:\n\n${lines.join('\n')} \n\nKindly let me know the prices.`
    );
    window.open(`https://wa.me/919686914264?text=${text}`, '_blank');
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-24">
      {/* Festive Header */}
      <header className="bg-red-800 text-white py-10 px-4 shadow-md">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-900/60 px-3 py-1 rounded-full text-amber-300 text-xs font-medium tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Christmas Stall 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Infant Mary Church, ICYM Katipalla</h1>
          <p className="text-red-100 mt-2 max-w-xl mx-auto text-sm md:text-base">
            Celebrate Christmas, support our new church
          </p>
          <div className="mt-6 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search star, santa, decor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white text-stone-900 placeholder-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <p className="text-red-100 mt-3 max-w-xl mx-auto text-sm md:text-base">
            🎁 Reasonable prices • Limited stock • Bulk orders taken. 
            Auto-prepare your order list at checkout, or order via 
            <a href="tel:+919606315054">Call</a> or 
            <a href="https://wa.me/919606315054" target="_blank" rel="noopener noreferrer">WhatsApp</a> 
            (<strong>9606315054</strong>).
          </p>
        </div>
      </header>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="text-center py-20 text-stone-500">Loading festive catalog...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const maxStock = Math.max(0, Number(item.available_stock) || 0);
              const isAvailable = item.in_stock && maxStock > 0;
              const qty = Math.min(wishlist[item.id] || 0, maxStock);
              const atMaxStock = qty >= maxStock;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                >
                  <div className="relative h-56 bg-stone-100">
                    <img
                      src={item.image_url || 'https://placehold.co/600x400?text=Christmas+Item'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isAvailable
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-800/80 text-stone-200'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-stone-900">{item.name}</h3>
                      <p className="text-stone-500 text-sm mt-1 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                      {!isAvailable ? (
                        <span className="text-xs font-medium text-stone-400">Currently unavailable</span>
                      ) : qty === 0 ? (
                        <button
                          onClick={() => updateQty(item.id, 1, maxStock)}
                          className="w-full py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4" /> Select Item
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                          <button
                            onClick={() => updateQty(item.id, -1, maxStock)}
                            className="p-1 text-emerald-900 hover:bg-emerald-200/60 rounded-lg cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold text-emerald-950 text-sm">
                            {qty} / {maxStock} Selected
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1, maxStock)}
                            disabled={atMaxStock}
                            className="p-1 text-emerald-900 hover:bg-emerald-200/60 rounded-lg disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Inquiry Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between z-40">
          <div>
            <p className="text-xs text-stone-400">Selected Items</p>
            <p className="font-semibold text-base">{selectedCount} item(s) in your list</p>
          </div>
          <button
            onClick={sendOrderInquiry}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Send className="w-4 h-4" /> Send Order List
          </button>
        </div>
      )}
    </div>
  );
}
