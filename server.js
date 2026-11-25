import 'dotenv/config';
import express from 'express';
import loginHandler from './api/login.js';
import catalogHandler from './api/catalog.js';
import checkoutHandler from './api/checkout.js';

const app = express();
app.use(express.json());

app.all('/api/login', (req, res) => loginHandler(req, res));
app.all('/api/catalog', (req, res) => catalogHandler(req, res));
app.all('/api/checkout', (req, res) => checkoutHandler(req, res));

app.listen(3001, () => console.log('API running on http://localhost:3001'));