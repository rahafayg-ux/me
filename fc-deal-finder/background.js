// Fetches FUTBIN prices for the content script. Cached and rate-limited so we are
// both fast (cache hits are instant) and polite (few concurrent requests).
const DEFAULTS = { platform: 'ps', futbinYear: 27 };
const TTL_MS = 10 * 60 * 1000;
const MAX_CONCURRENT = 3;

const cache = new Map(); // key -> { price, at } | { pending: Promise }
let active = 0;
const queue = [];

function run(task) {
  return new Promise((resolve) => {
    queue.push({ task, resolve });
    pump();
  });
}

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    const { task, resolve } = queue.shift();
    active++;
    task()
      .catch(() => null)
      .then((v) => {
        active--;
        resolve(v);
        pump();
      });
  }
}

async function fetchPrice(id, { platform, futbinYear }) {
  const res = await fetch(`https://www.futbin.com/${futbinYear}/playerPrices?player=${id}`);
  if (!res.ok) return null;
  const json = await res.json();
  const lc = json?.[id]?.prices?.[platform]?.LCPrice;
  const price = Number(String(lc ?? '').replace(/[^\d]/g, ''));
  return price > 0 ? price : null;
}

async function getPrice(id) {
  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  const key = `${settings.futbinYear}:${settings.platform}:${id}`;
  const hit = cache.get(key);
  if (hit?.pending) return hit.pending;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.price;

  const pending = run(() => fetchPrice(id, settings)).then((price) => {
    cache.set(key, { price, at: Date.now() });
    return price;
  });
  cache.set(key, { pending });
  return pending;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'futbinPrice') return;
  getPrice(msg.id).then((price) => sendResponse({ price }));
  return true; // async response
});
