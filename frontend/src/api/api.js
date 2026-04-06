const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function shortenUrl(url, alias = '', ttl = null) {
  const response = await fetch(`${BASE_URL}/api/shorten`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      alias:  alias  || undefined,  
      ttl:    ttl    || undefined, 
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to shorten URL');
  }

  return data;
}

export async function getAnalytics(shortId) {
  const response = await fetch(`${BASE_URL}/api/analytics/${shortId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch analytics');
  }

  return data;
}

export async function deleteUrl(shortId) {
  const response = await fetch(`${BASE_URL}/api/shorten/${shortId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete URL');
  }

  return data;
}

export async function previewUrl(shortId) {
  const response = await fetch(`${BASE_URL}/preview/${shortId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Short URL not found');
  }

  return data;
}