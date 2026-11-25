import jwt from 'jsonwebtoken';
import { getDoc } from './_sheets.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { cart, customerName } = req.body;
  if (!cart || !cart.length) return res.status(400).json({ error: 'Cart is empty' });

  try {
    const doc = await getDoc();
    const invSheet = doc.sheetsByTitle['Inventory'];
    const logSheet = doc.sheetsByTitle['SalesLog'];
    const rows = await invSheet.getRows();

    let summaryParts = [];
    let totalItems = 0;
    let totalValue = 0;

    for (const item of cart) {
      const row = rows.find((r) => r.get('id') === item.id);
      if (!row) continue;

      const currentStock = Number(row.get('stock')) || 0;
      if (currentStock < item.qty) {
        return res.status(400).json({ error: `Not enough stock for ${row.get('name')}` });
      }

      row.set('stock', currentStock - item.qty);
      await row.save();

      const price = Number(row.get('price')) || 0;
      summaryParts.push(`${item.qty}x ${row.get('name')}`);
      totalItems += item.qty;
      totalValue += price * item.qty;
    }

    const istTimestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const cleanName = customerName?.trim();
    await logSheet.addRow({
      timestamp: istTimestamp,
      customer_name: cleanName || 'Walk-in',
      items_summary: summaryParts.join(', '),
      total_items: totalItems,
      total_value: totalValue,
    });

    res.status(200).json({
      message: `Hi ${cleanName || 'there'}, thank you for shopping!`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Checkout failed' });
  }
}