import express from 'express';
import { nanoid } from 'nanoid';
import {
  saveURL,
  getURL,
  shortIdExists,
  getAnalytics,
  checkRateLimit,
  deleteURL,
} from '../services/redis.js';

const router = express.Router();

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidAlias(alias) {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(alias);
}

async function generateUniqueId() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = nanoid(7);
    const exists = await shortIdExists(id);
    if (!exists) return id;
  }
  throw new Error('Failed to generate a unique short ID after 5 attempts.');
}

router.post('/shorten', async (req, res) => {
  const { url, alias, ttl } = req.body;

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
             || req.socket.remoteAddress
             || 'unknown';

    const rateLimit = await checkRateLimit(ip, 10, 60);

    res.set('X-RateLimit-Remaining', rateLimit.remaining);
    res.set('X-RateLimit-Retry-After', rateLimit.retryAfter);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `You can only shorten 10 URLs per minute. Retry in ${rateLimit.retryAfter}s.`,
        retryAfter: rateLimit.retryAfter,
      });
    }

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL',
        message: 'Please provide a "url" field in the request body.',
      });
    }

    if (typeof url !== 'string' || url.length > 2048) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'URL must be a string under 2048 characters.',
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'URL must start with http:// or https:// and be a valid web address.',
      });
    }

    let parsedTtl = null;
    if (ttl !== undefined) {
      parsedTtl = parseInt(ttl, 10);
      if (isNaN(parsedTtl) || parsedTtl < 60 || parsedTtl > 60 * 60 * 24 * 365) {
        return res.status(400).json({
          error: 'Invalid TTL',
          message: 'TTL must be a number between 60 (1 min) and 31536000 (1 year) seconds.',
        });
      }
    }

    let shortId;

    if (alias) {
      if (!isValidAlias(alias)) {
        return res.status(400).json({
          error: 'Invalid alias',
          message: 'Alias must be 3–20 characters and only contain letters, numbers, - or _',
        });
      }

      const alreadyExists = await shortIdExists(alias);
      if (alreadyExists) {
        return res.status(409).json({
          error: 'Alias taken',
          message: `The alias "${alias}" is already in use. Please choose a different one.`,
        });
      }

      shortId = alias;
    } else {
      shortId = await generateUniqueId();
    }

    await saveURL(shortId, url, parsedTtl);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/${shortId}`;

    return res.status(201).json({
      success: true,
      shortId,
      shortUrl,
      longUrl: url,
      expiresIn: parsedTtl
        ? `${parsedTtl} seconds (${Math.round(parsedTtl / 3600 * 10) / 10} hours)`
        : null,
    });

  } catch (err) {
    console.error('Error in POST /shorten:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong while shortening your URL.',
    });
  }
});

router.get('/analytics/:shortId', async (req, res) => {
  const { shortId } = req.params;

  try {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(shortId)) {
      return res.status(400).json({ error: 'Invalid short ID format.' });
    }

    const analytics = await getAnalytics(shortId);

    if (!analytics) {
      return res.status(404).json({
        error: 'Not found',
        message: `No data found for "${shortId}". It may have expired.`,
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    return res.status(200).json({
      success: true,
      shortId,
      shortUrl: `${baseUrl}/${shortId}`,
      longUrl: analytics.longUrl,
      totalClicks: analytics.totalClicks,
      history: analytics.history,
    });

  } catch (err) {
    console.error(`Error in GET /analytics/${shortId}:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/shorten/:shortId', async (req, res) => {
  const { shortId } = req.params;

  try {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(shortId)) {
      return res.status(400).json({ error: 'Invalid short ID format.' });
    }

    const exists = await shortIdExists(shortId);
    if (!exists) {
      return res.status(404).json({
        error: 'Not found',
        message: `Short URL "${shortId}" does not exist.`,
      });
    }

    await deleteURL(shortId);

    return res.status(200).json({
      success: true,
      message: `Short URL "${shortId}" and its analytics have been deleted.`,
    });

  } catch (err) {
    console.error(`Error in DELETE /shorten/${shortId}:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;