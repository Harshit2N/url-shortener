import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import shortenRouter from './src/routes/shorten.js';
import redirectRouter from './src/routes/redirect.js';
import { globalLimiter } from './src/middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*', 
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(globalLimiter);

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 500 ? '\x1b[31m'  
                : res.statusCode >= 400 ? '\x1b[33m'  
                : res.statusCode >= 300 ? '\x1b[36m' 
                : '\x1b[32m';                       
    const reset = '\x1b[0m';

    console.log(
      `${color}[${res.statusCode}]${reset} ${req.method} ${req.originalUrl} — ${duration}ms`
    );
  });

  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'ok',
    uptime:    `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    baseUrl:   BASE_URL,
  });
});

app.use('/api', shortenRouter);

app.use('/', redirectRouter);

app.use((req, res) => {
  res.status(404).json({
    error:   'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error:   'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong.'
      : err.message, 
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('URL Shortener is running!');
  console.log(`Server   : ${BASE_URL}`);
  console.log(`Health   : ${BASE_URL}/health`);
  console.log(`Shorten  : POST ${BASE_URL}/api/shorten`);
  console.log(`Redirect : GET  ${BASE_URL}/:shortId`);
  console.log(`Analytics: GET  ${BASE_URL}/api/analytics/:shortId`);
  console.log(`Delete   : DELETE ${BASE_URL}/api/shorten/:shortId`);
  console.log('');
});

export default app;