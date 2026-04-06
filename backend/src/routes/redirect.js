import express from 'express';
import { getURL, recordClick } from '../services/redis.js';
import { checkRateLimit } from '../services/redis.js';

const router = express.Router();

router.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;

  try {

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
             || req.socket.remoteAddress
             || 'unknown';

    const rateLimit = await checkRateLimit(ip, 30, 60);

    res.set('X-RateLimit-Remaining', rateLimit.remaining);
    res.set('X-RateLimit-Retry-After', rateLimit.retryAfter);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Slow down! Try again in ${rateLimit.retryAfter} seconds.`,
        retryAfter: rateLimit.retryAfter,
      });
    }

    const validShortId = /^[a-zA-Z0-9_-]{3,20}$/.test(shortId);
    if (!validShortId) {
      return res.status(400).json({
        error: 'Invalid short ID',
        message: 'Short ID must be 3–20 alphanumeric characters.',
      });
    }

    const longUrl = await getURL(shortId);

    if (!longUrl) {
      return res.status(404).json({
        error: 'Short URL not found',
        message: `No URL found for "${shortId}". It may have expired or never existed.`,
      });
    }

    recordClick(shortId).catch((err) =>
      console.error(` Failed to record click for ${shortId}:`, err)
    );

    return res.redirect(302, longUrl);

  } catch (err) {
    console.error(`Redirect error for shortId "${shortId}":`, err);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong. Please try again.',
    });
  }
});

router.get('/preview/:shortId', async (req, res) => {
  const { shortId } = req.params;

  try {
    const validShortId = /^[a-zA-Z0-9_-]{3,20}$/.test(shortId);
    if (!validShortId) {
      return res.status(400).json({ error: 'Invalid short ID format.' });
    }

    const longUrl = await getURL(shortId);

    if (!longUrl) {
      return res.status(404).json({
        error: 'Short URL not found',
        message: `No URL found for "${shortId}".`,
      });
    }

    return res.status(200).json({
      shortId,
      shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${shortId}`,
      longUrl,
    });

  } catch (err) {
    console.error(`Preview error for shortId "${shortId}":`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;