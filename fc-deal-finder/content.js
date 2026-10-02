(() => {
  const S = self.FC_SELECTORS;
  const DEFAULTS = { enabled: true, thresholdPct: 5, minPrice: 100000, minMinutes: 59, hideShort: true };
  let settings = { ...DEFAULTS };

  const num = (text) => Number(String(text ?? '').replace(/[^\d]/g, '')) || 0;
  const fmt = (n) => n.toLocaleString('en-US');

  // "<30 Seconds", "45 Minutes", "1 Hour" -> minutes (rounded up); null if unreadable.
  function parseMinutes(text) {
    const m = String(text).match(/(\d+)\s*(second|minute|hour|day)/i);
    if (!m) return null;
    const mult = { second: 1 / 60, minute: 1, hour: 60, day: 1440 }[m[2].toLowerCase()];
    return Math.ceil(Number(m[1]) * mult);
  }

  function readItem(el) {
    const rows = [...el.querySelectorAll(S.priceRow)];
    const timeRow = rows.find((r) => r.querySelector(S.priceLabel)?.textContent.toLowerCase().includes(S.timeLabelText));
    const labelText = timeRow?.querySelector(S.priceLabel)?.textContent ?? '';
    // Fall back to scanning the whole card: the only "N unit" text on it is the time left.
    const minutes = parseMinutes(timeRow ? timeRow.textContent.replace(labelText, '') : el.textContent);

    const bin = rows
      .filter((row) => row.querySelector(S.priceLabel)?.textContent.toLowerCase().includes(S.binLabelText))
      .map((row) => num(row.querySelector(S.priceValue)?.textContent))[0] || 0;
    const name = el.querySelector(S.name)?.textContent.trim() ?? '';
    const rating = el.querySelector(S.rating)?.textContent.trim() ?? '';
    const src = el.querySelector(S.portrait)?.getAttribute('src') ?? '';
    const id = src.match(/(\d{4,9})\.(?:png|jpg|webp)/)?.[1] ?? null;
    return { bin, name, rating, id, minutes };
  }

  const askFutbin = (id) =>
    new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'futbinPrice', id }, (r) =>
        resolve(chrome.runtime.lastError || !r ? { error: 'extension error' } : r)
      )
    );

  function clear(el) {
    el.classList.remove('fcdf-deal', 'fcdf-hidden');
    el.querySelector('.fcdf-badge')?.remove();
  }

  function badge(el, text, cls) {
    const b = document.createElement('div');
    b.className = `fcdf-badge ${cls}`;
    b.textContent = text;
    el.appendChild(b);
  }

  async function evaluate(items) {
    await Promise.all(
      items.map(async (el) => {
        const p = readItem(el);
        el.dataset.fcdfMin = p.minutes ?? '';
        const unreadable = settings.minMinutes && p.minutes == null;
        const inTime = !settings.minMinutes || (p.minutes != null && p.minutes >= settings.minMinutes);
        const sig = `${p.bin}|${settings.thresholdPct}|${settings.minPrice}|${settings.minMinutes}|${inTime}|${unreadable}|${settings.hideShort}|${settings.enabled}`;
        if (el.dataset.fcdf === sig) return;
        el.dataset.fcdf = sig;
        clear(el);
        if (!settings.enabled || !p.bin) return;
        if (unreadable) return badge(el, "can't read time left", 'fcdf-muted');
        if (!inTime) return settings.hideShort && el.classList.add('fcdf-hidden');

        // Only FUTBIN's price counts as market value; never guess from other listings.
        const { price: ref, error } = p.id ? await askFutbin(p.id) : { error: 'no card id' };
        if (!ref) return badge(el, `no FUTBIN price (${error}, id ${p.id ?? '?'})`, 'fcdf-muted');
        if (ref < settings.minPrice) return; // card's market value is under the minimum

        const discount = ((ref - p.bin) / ref) * 100;
        if (discount < settings.thresholdPct) return;

        el.classList.add('fcdf-deal');
        badge(el, `-${discount.toFixed(1)}% vs FUTBIN ${fmt(ref)}`, '');
      })
    );
  }

  function updateHiddenNote() {
    const hidden = document.querySelectorAll('.fcdf-hidden').length;
    const mins = [...document.querySelectorAll(`${S.item}[data-fcdf-min]`)]
      .map((el) => Number(el.dataset.fcdfMin))
      .filter((n) => isMinutes(n));
    let note = document.getElementById('fcdf-note');
    if (!hidden && !mins.length) return note?.remove();
    if (!note) {
      note = document.createElement('div');
      note.id = 'fcdf-note';
      document.body.appendChild(note);
    }
    const longest = mins.length ? `${Math.max(...mins)} min` : "couldn't read times";
    note.textContent = `FC Deal Finder: ${hidden} hidden (under ${settings.minMinutes} min). Longest time left on this page: ${longest}`;
  }
  const isMinutes = (n) => Number.isFinite(n) && n > 0;

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const items = [...document.querySelectorAll(S.item)];
      if (items.length) evaluate(items).then(updateHiddenNote);
      else updateHiddenNote();
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
