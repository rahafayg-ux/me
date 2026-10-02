# FC Deal Finder (Chrome extension)

Highlights Transfer Market listings whose Buy Now price is **100k+** and at least **5% below FUTBIN's price**. It shows a green outline and a badge such as `-7.2% vs FUTBIN 1,250,000`. **You click Buy yourself.**

## Install
1. Download and unzip `fc-deal-finder.zip` (or use this folder).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the unzipped folder.
4. Open the FC Web App, go to the Transfer Market, and search. Matching listings light up.

Click the extension icon to change the discount %, minimum price, platform and FUTBIN year.

## Notes
- Untested against the live Web App. If nothing highlights, edit `selectors.js` (the only place page-structure guesses live).
- If a FUTBIN price can't be found, the next-cheapest BIN for the same name and rating in the results is used instead.
- EA takes a 5% sell tax, so a 5% discount only breaks even on resale. Raise the discount % if you plan to flip.
- It doesn't press Buy, so it doesn't automate the market. It's a highlighter.
