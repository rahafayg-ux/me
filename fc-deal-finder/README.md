# FC Deal Finder (Chrome extension)

Highlights Transfer Market listings for cards worth **100k+** whose Buy Now is at least **5% below the price shown on the card** (the green box at the top-left, added by your other price tool). It shows a green outline and a badge such as `-7.2% vs card price 1,250,000`. **You click Buy yourself.**

## Install
1. Download and unzip `fc-deal-finder.zip` (or use this folder).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the unzipped folder.
4. Open the FC Web App, go to the Transfer Market, and search. Matching listings light up.

Only listings with **59 minutes or more** left (freshly listed) are checked. Anything with less time left is hidden from the list (toggle in the popup) and never price-checked, and a card whose time can't be read gets a grey badge and is skipped. Change or disable this in the popup.

Click the extension icon to change the discount %, minimum card price, minimum time left, and hiding of short listings.

## Jump to 59 min
A small panel in the bottom-left shows how many listings are hidden and has a **Jump to 59 min** button. One click makes it press **Next** by itself, with a short random pause between pages, until a page has a listing with 59+ minutes left (max 40 pages). Click it again to stop. It never buys, bids or refreshes.

**Risk:** pressing Next automatically is automated use of the Transfer Market, which EA's terms prohibit. It can get an account flagged or banned. Use it knowingly, sparingly, and at your own risk.

## Notes
- Untested against the live Web App. If nothing highlights, edit `selectors.js` (the only place page-structure guesses live).
- If no price is shown on a card, the listing gets a grey badge and is never treated as a deal. The price comes from the green box added by your other price tool, so that tool must stay installed.
- EA takes a 5% sell tax, so a 5% discount only breaks even on resale. Raise the discount % if you plan to flip.
- It doesn't press Buy, so it doesn't automate the market. It's a highlighter.
