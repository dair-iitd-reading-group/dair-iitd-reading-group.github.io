# Lab Reading Group — GitHub Pages

A minimal one-page reading-group website backed by a public Google Sheet.

## Google Sheet

The site expects the first row to contain exactly these column names:

1. `Date`
2. `Topic`
3. `Presenter`
4. `Presenter website`
5. `Slide link`

The Google Sheet ID is already configured in `script.js`.

### Important

The spreadsheet must be accessible to anyone with the link as a viewer, or published to the web. The page only reads the sheet; it does not request edit access.

The website reads the **first tab** of the spreadsheet. If the schedule is on another tab, change `SHEET_CSV_URL` in `script.js` to include:

    &sheet=YOUR_TAB_NAME

## GitHub Pages

1. Create a GitHub repository, e.g. `lab-reading-group`.
2. Upload `index.html`, `style.css`, and `script.js`.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save.

GitHub will provide the public Pages URL.

## Updating sessions

You do not need to edit the website when adding sessions. Add a row to the Google Sheet and refresh the website.

## Notes

- Presenter names are linked using column D.
- The visible slide link text is simply `Slides`, using column E as the destination.
- Dates are formatted by the browser's locale.
- The page is responsive and includes a persistent light/dark mode preference.
