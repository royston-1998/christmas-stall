import jwt from 'jsonwebtoken';
import { getDoc } from './_sheets.js';

export default async function handler(req, res) {
  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      isAdmin = true;
    } catch {}
  }

  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Inventory'];
    const rows = await sheet.getRows();

    const items = rows.map((row) => {
      const stockNum = Number(row.get('stock')) || 0;
      const base = {
        id: row.get('id'),
        name: row.get('name'),
        description: row.get('description'),
        image_url: row.get('image_url'),
        price: Number(row.get('price')) || 0,
        in_stock: stockNum > 0,
        available_stock: stockNum,
      };
      if (isAdmin) {
        base.stock = stockNum;
        base.price = Number(row.get('price')) || 0;
      }
      return base;
    });

    res.status(200).json({ items });
  } catch (err) {
    console.log('CATALOG ERROR:', err);
    res.status(500).json({ error: 'Failed to load catalog', err });
  }
}
