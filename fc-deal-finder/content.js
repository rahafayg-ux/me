(() => {
  const S = self.FC_SELECTORS;
  const DEFAULTS = { enabled: true, thresholdPct: 5, minPrice: 100000 };
  let settings = { ...DEFAULTS };

  const num = (text) => Number(String(text ?? '').replace(/[^\d]/g, '')) || 0;
  const fmt = (n) => n.toLocaleString('en-US');

  function readItem(el) {
    const bin = [...el.querySelectorAll(S.priceRow)]
      .filter((row) => row.querySelector(S.priceLabel)?.textContent.toLowerCase().includes(S.binLabelText))
      .map((row) => num(row.querySelector(S.priceValue)?.textContent))[0] || 0;
    const name = el.querySelector(S.name)?.textContent.trim() ?? '';
    const rating = el.querySelector(S.rating)?.textContent.trim() ?? '';
    const src = el.querySelector(S.portrait)?.getAttribute('src') ?? '';
    const id = src.match(/(\d{4,9})\.(?:png|jpg|webp)/)?.[1] ?? null;
    return { bin, name, rating, id };
  }

  const askFutbin = (id) =>
    new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'futbinPrice', id }, (r) => resolve(chrome.runtime.lastError ? null : r?.price ?? null))
    );

  function clear(el) {
    el.classList.remove('fcdf-deal');
    el.querySelector('.fcdf-badge')?.remove();
  }

  async function evaluate(items) {
    // Reference fallback: lowest other BIN for the same name+rating within this results page.
    const group = new Map();
    const parsed = items.map((el) => ({ el, ...readItem(el) }));
    for (const p of parsed) {
      const k = `${p.name}|${p.rating}`;
      const list = group.get(k) ?? [];
      list.push(p.bin);
      group.set(k, list);
    }

    await Promise.all(
      parsed.map(async (p) => {
        const sig = `${p.bin}|${settings.thresholdPct}|${settings.minPrice}|${settings.enabled}`;
        if (p.el.dataset.fcdf === sig) return;
        p.el.dataset.fcdf = sig;
        clear(p.el);
        if (!settings.enabled || p.bin < settings.minPrice) return;

        let ref = p.id ? await askFutbin(p.id) : null;
        let source = 'FUTBIN';
        if (!ref) {
          const others = (group.get(`${p.name}|${p.rating}`) ?? []).filter((b) => b > p.bin);
          ref = others.length ? Math.min(...others) : null;
          source = 'next BIN';
        }
        if (!ref) return;

        const discount = ((ref - p.bin) / ref) * 100;
        if (discount < settings.thresholdPct) return;

        p.el.classList.add('fcdf-deal');
        const badge = document.createElement('div');
        badge.className = 'fcdf-badge';
        badge.textContent = `-${discount.toFixed(1)}% vs ${source} ${fmt(ref)}`;
        p.el.appendChild(badge);
      })
    );
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const items = [...document.querySelectorAll(S.item)];
      if (items.length) evaluate(items);
    });
  }

  chrome.storage.sync.get(DEFAULTS, (s) => {
    settings = { ...DEFAULTS, ...s };
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
  });

  chrome.storage.onChanged.addListener((changes) => {
    for (const [k, v] of Object.entries(changes)) if (k in DEFAULTS) settings[k] = v.newValue;
    schedule();
  });
})();
