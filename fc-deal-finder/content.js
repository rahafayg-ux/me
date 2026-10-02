(() => {
  const S = self.FC_SELECTORS;
  const DEFAULTS = { enabled: true, thresholdPct: 5, minPrice: 100000, minMinutes: 59, hideShort: true };
  let settings = { ...DEFAULTS };

  const num = (text) => Number(String(text ?? '').replace(/[^\d]/g, '')) || 0;
  const fmt = (n) => n.toLocaleString('en-US');

  // "<30 Seconds", "45 Minutes", "1 Hour" -> minutes (rounded up); null if unreadable.
  function parseMinutes(text) {
    if (/expired/i.test(text)) return 0;
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
    return { bin, name, rating, minutes, ref: readCardPrice(el) };
  }

  // The price shown in the green box on the card (added by another price tool), i.e. the
  // first standalone number on the card that isn't inside a Start/Bid/Buy Now/Time row.
  function readCardPrice(el) {
    for (const n of el.querySelectorAll('*')) {
      if (n.children.length || n.closest(`${S.priceRow}, .fcdf-badge`)) continue;
      const t = n.textContent.trim();
      if (/^\d{1,3}(,\d{3})+$|^\d{3,}$/.test(t) && num(t) >= 200) return num(t);
    }
    return null;
  }

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
        const sig = `${p.bin}|${p.ref}|${settings.thresholdPct}|${settings.minPrice}|${settings.minMinutes}|${inTime}|${unreadable}|${settings.hideShort}|${settings.enabled}`;
        if (el.dataset.fcdf === sig) return;
        el.dataset.fcdf = sig;
        clear(el);
        if (!settings.enabled || !p.bin) return;
        if (unreadable) return badge(el, "can't read time left", 'fcdf-muted');
        if (!inTime) return settings.hideShort && el.classList.add('fcdf-hidden');

        // Only the card's own displayed price counts as market value; never guess from other listings.
        const ref = p.ref;
        if (!ref) return badge(el, 'no price found on card', 'fcdf-muted');
        if (ref < settings.minPrice) return; // card's market value is under the minimum

        const discount = ((ref - p.bin) / ref) * 100;
        if (discount < settings.thresholdPct) return;

        el.classList.add('fcdf-deal');
        badge(el, `-${discount.toFixed(1)}% vs card price ${fmt(ref)}`, '');
      })
    );
  }

  // Corner panel: status note + "Jump to 59 min" button. Created once so updating it never
  // re-triggers the page scan.
  const ui = document.createElement('div');
  ui.id = 'fcdf-ui';
  const noteEl = document.createElement('div');
  const jumpBtn = document.createElement('button');
  ui.append(noteEl, jumpBtn);
  document.body.appendChild(ui);

  const setText = (el, text) => el.textContent !== text && (el.textContent = text);
  const isMinutes = (n) => Number.isFinite(n) && n > 0;
  const longListings = () =>
    [...document.querySelectorAll(`${S.item}[data-fcdf-min]`)].filter(
      (el) => el.dataset.fcdfMin !== '' && Number(el.dataset.fcdfMin) >= settings.minMinutes
    );

  let jumping = false;
  let jumpStatus = '';
  function updateUi() {
    const hidden = document.querySelectorAll('.fcdf-hidden').length;
    const mins = [...document.querySelectorAll(`${S.item}[data-fcdf-min]`)]
      .map((el) => Number(el.dataset.fcdfMin))
      .filter(isMinutes);
    const longest = mins.length ? `${Math.max(...mins)} min` : "couldn't read times";
    setText(
      noteEl,
      `${hidden} hidden (under ${settings.minMinutes} min). Longest on this page: ${longest}${jumpStatus ? ` · ${jumpStatus}` : ''}`
    );
    setText(jumpBtn, jumping ? 'Stop' : `Jump to ${settings.minMinutes} min`);
    ui.hidden = !document.querySelector(S.item);
  }

  // Jump: click Next (one user click, throttled, capped) until a page has a listing with
  // at least the minimum time left. Never buys, bids or refreshes.
  const MAX_JUMP_PAGES = 40;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const pageSig = () => [...document.querySelectorAll(S.item)].slice(0, 4).map((el) => el.textContent).join('|');
  const nextButton = () =>
    [...document.querySelectorAll('button')].find(
      (b) => b.textContent.trim().toLowerCase() === S.nextText && !b.disabled && !b.classList.contains('disabled')
    );

  async function jump() {
    if (jumping) {
      jumping = false;
      return;
    }
    jumping = true;
    let page = 0;
    for (; jumping && page < MAX_JUMP_PAGES; page++) {
      jumpStatus = `looking… page ${page + 1}`;
      updateUi();
      await sleep(rand(900, 1600)); // let results render and be checked
      if (longListings().length) { jumpStatus = `found on page ${page + 1}`; break; }
      const next = nextButton();
      if (!next) { jumpStatus = 'no more pages'; break; }
      const before = pageSig();
      next.click();
      for (let waited = 0; pageSig() === before; waited += 200) {
        if (waited >= 6000) { jumpStatus = "page didn't change"; jumping = false; break; }
        await sleep(200);
      }
    }
    if (jumping && !longListings().length && page >= MAX_JUMP_PAGES) jumpStatus = `none in ${MAX_JUMP_PAGES} pages`;
    jumping = false;
    updateUi();
  }
  jumpBtn.addEventListener('click', jump);

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const items = [...document.querySelectorAll(S.item)];
      (items.length ? evaluate(items) : Promise.resolve()).then(updateUi);
    });
  }

  const own = (n) => (n.nodeType === 1 ? n : n.parentElement)?.closest('#fcdf-ui, .fcdf-badge');
  chrome.storage.sync.get(DEFAULTS, (s) => {
    settings = { ...DEFAULTS, ...s };
    new MutationObserver((muts) => {
      if (!muts.every((m) => own(m.target))) schedule();
    }).observe(document.body, { childList: true, subtree: true });
    schedule();
  });

  chrome.storage.onChanged.addListener((changes) => {
    for (const [k, v] of Object.entries(changes)) if (k in DEFAULTS) settings[k] = v.newValue;
    schedule();
  });
})();
