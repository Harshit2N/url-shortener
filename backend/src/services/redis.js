import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
  socket:{
     tls:true
  }
});

client.on('connect', () => console.log('Redis connected'));
client.on('error',   (err) => console.error('Redis error:', err));
client.on('end',     () => console.log('Redis disconnected'));

await client.connect();

export async function saveURL(shortId, longUrl, ttl = null) {
  const key = `url:${shortId}`;
  if (ttl) {
    await client.set(key, longUrl, { EX: ttl });
  } else {
    await client.set(key, longUrl);
  }
  await client.sAdd('all:urls', shortId);
}

export async function getURL(shortId) {
  return await client.get(`url:${shortId}`);
}

export async function deleteURL(shortId) {
  await client.del(`url:${shortId}`);
  await client.del(`clicks:${shortId}`);
  await client.del(`clicks:history:${shortId}`);
  await client.sRem('all:urls', shortId);
}

export async function getAllShortIds() {
  return await client.sMembers('all:urls');
}

export async function recordClick(shortId) {
  await client.incr(`clicks:${shortId}`);
  const now = Date.now().toString();
  await client.lPush(`clicks:history:${shortId}`, now);
  await client.lTrim(`clicks:history:${shortId}`, 0, 499);
}

export async function getClickCount(shortId) {
  const count = await client.get(`clicks:${shortId}`);
  return count ? parseInt(count, 10) : 0;
}

export async function getClickHistory(shortId, limit = 100) {
  const history = await client.lRange(`clicks:history:${shortId}`, 0, limit - 1);
  return history.map(Number);
}

export async function checkRateLimit(ip, limit = 10, window = 60) {
  const key = `ratelimit:${ip}`;
  const count = await client.incr(key);

  if (count === 1) {
    await client.expire(key, window);
  }

  const ttl = await client.ttl(key);

  if (count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: ttl,
    };
  }

  return {
    allowed: true,
    remaining: limit - count,
    retryAfter: 0,
  };
}

export async function shortIdExists(shortId) {
  const result = await client.exists(`url:${shortId}`);
  return result === 1;
}

export async function getAnalytics(shortId) {
  const longUrl = await getURL(shortId);
  if (!longUrl) return null;

  const [totalClicks, history] = await Promise.all([
    getClickCount(shortId),
    getClickHistory(shortId),
  ]);

  return {
    shortId,
    longUrl,
    totalClicks,
    history,
  };
}

export default client;