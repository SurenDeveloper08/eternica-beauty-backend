const express = require('express');
const app = express();
const errorMiddleware = require('./middlewares/error');
const cookieParser = require('cookie-parser')
const path = require('path')
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config({ path: path.join(__dirname, "config/config.env") });

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://spastore.me',
  credentials: true,
}));

// Also needed:
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(require('cookie-parser')());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.set('trust proxy', true);
const products = require('./routes/product')
const auth = require('./routes/auth')
const order = require('./routes/order')
const payment = require('./routes/payment')
const category = require('./routes/category')
const banner = require('./routes/banner')
const ad = require('./routes/ad')
const poster = require('./routes/poster')
const season = require('./routes/season')
const subscribe = require('./routes/subscribe')
const cart = require('./routes/cart')
const dashboard = require('./routes/dashboard')
const highlight = require('./routes/ProductHighlight')
const seo = require('./routes/seo')
const review = require('./routes/review')
const gcc = require('./routes/gccCountry')
const sitemap = require('./routes/sitemap')
const blog = require('./routes/blog')
const ip = require('./routes/ip')
const contact = require('./routes/contact')
const topCategory = require('./routes/topCategory')
app.use('/api/v1/', products);
app.use('/api/v1/', category);
app.use('/api/v1/', auth);
app.use('/api/v1/', banner);
app.use('/api/v1/', ad);
app.use('/api/v1/', poster);
app.use('/api/v1/', season);
app.use('/api/v1/', subscribe);
app.use('/api/v1/', cart);
app.use('/api/v1/', order);
app.use('/api/v1/', dashboard)
app.use('/api/v1/', highlight)
app.use('/api/v1/', seo)
app.use('/api/v1/', review)
app.use('/api/v1/', gcc)
app.use('/api/v1/', blog)
app.use('/api/v1/', ip);
app.use('/api/v1/', contact);
app.use('/api/v1/', topCategory);
app.use('/', sitemap);
// app.use('/api/v1/',payment);


if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
  })
}

app.use(errorMiddleware)

module.exports = app;