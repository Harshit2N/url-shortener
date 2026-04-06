import { checkRateLimit } from '../services/redis.js';

export function rateLimiter({ limit = 10, window = 60, message } = {}) {
  return async (req, res, next) => {
    try {

      const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
               || req.socket.remoteAddress
               || 'unknown';

      const result = await checkRateLimit(ip, limit, window);

      res.set('X-RateLimit-Limit',     limit);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Window',    `${window}s`);

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter); 

        return res.status(429).json({
          error:      'Too Many Requests',
          message:    message || `Rate limit exceeded. Max ${limit} requests per ${window}s.`,
          retryAfter: result.retryAfter,
          limit,
          window:     `${window} seconds`,
        });
      }
      next();

    } catch (err) {
      console.error('⚠️  Rate limiter error (failing open):', err.message);
      next();
    }
  };
}

export const shortenLimiter = rateLimiter({
  limit:   10,
  window:  60,
  message: 'You can only shorten 10 URLs per minute. Please slow down.',
});

export const redirectLimiter = rateLimiter({
  limit:   60,
  window:  60,
  message: 'Too many redirects from your IP. Retry in a moment.',
});

export const analyticsLimiter = rateLimiter({
  limit:   30,
  window:  60,
  message: 'Too many analytics requests. Max 30 per minute.',
});

export const deleteLimiter = rateLimiter({
  limit:   5,
  window:  60,
  message: 'Max 5 delete operations per minute.',
});

export const globalLimiter = rateLimiter({
  limit:   100,
  window:  60,
  message: 'Global rate limit exceeded. Max 100 requests per minute per IP.',
});