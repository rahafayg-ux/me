const DEFAULTS = { enabled: true, thresholdPct: 5, minPrice: 100000, minMinutes: 59, hideShort: true, platform: 'ps', futbinYear: 27 };
chrome.storage.sync.get(DEFAULTS, (s) => {
  for (const [key, def] of Object.entries(DEFAULTS)) {
    const el = document.getElementById(key);
    const isBool = typeof def === 'boolean';
    el[isBool ? 'checked' : 'value'] = s[key];
    el.addEventListener('change', () => {
      const raw = isBool ? el.checked : el.value;
      chrome.storage.sync.set({ [key]: typeof def === 'number' ? Number(raw) : raw });
    });
  }
});
