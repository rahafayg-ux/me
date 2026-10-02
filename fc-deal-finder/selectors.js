// All page-structure assumptions live here. If EA changes the Web App markup (or the
// extension highlights nothing), this is the only file that should need editing.
self.FC_SELECTORS = {
  item: '.listFUTItem',
  name: '.name',
  rating: '.rating',
  // Each price row on a listing; the one whose label contains "Buy Now" is the BIN.
  priceRow: '.auctionValue',
  priceLabel: '.label',
  priceValue: '.currency-coins.value',
  binLabelText: 'buy now',
  // Card portrait; the numeric id in its URL is used for the FUTBIN lookup.
  portrait: 'img'
};
