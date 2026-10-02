# FC Deal Finder (Chrome extension)

Highlights Transfer Market listings for cards worth **100k+** (by FUTBIN price) whose Buy Now is at least **5% below FUTBIN's price**. It shows a green outline and a badge such as `-7.2% vs FUTBIN 1,250,000`. **You click Buy yourself.**

## Install
1. Download and unzip `fc-deal-finder.zip` (or use this folder).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the unzipped folder.
4. Open the FC Web App, go to the Transfer Market, and search. Matching listings light up.

Only listings with **59 minutes or more** left (freshly listed) are checked. Anything with less time left is skipped, and a card whose time can't be read gets a grey badge and is skipped. Change or disable this in the popup.

Click the extension icon to change the discount %, minimum price, platform and FUTBIN year.

## Notes
- Untested against the live Web App. If nothing highlights, edit `selectors.js` (the only place page-structure guesses live).
- If no FUTBIN price can be found, the listing gets a grey badge saying why (HTTP status or missing card id) and is never treated as a deal.
- EA takes a 5% sell tax, so a 5% discount only breaks even on resale. Raise the discount % if you plan to flip.
- It doesn't press Buy, so it doesn't automate the market. It's a highlighter.
