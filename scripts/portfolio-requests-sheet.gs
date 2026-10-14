/**
 * Google Apps Script — saves each "Request the Portfolio" submission
 * (links.html) as a new row in a Google Sheet.
 *
 * Setup (from Mia's Google account, ~5 minutes):
 *  1. Create a new Google Sheet, e.g. "Portfolio requests".
 *  2. Extensions → Apps Script. Delete the sample code, paste this whole
 *     file, click Save.
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *     Click Deploy, allow the permissions, copy the Web app URL (ends in /exec).
 *  4. Paste that URL into SHEET_ENDPOINT in links.html, then redeploy the site.
 */

const COLUMNS = [
  "Date", "Purpose", "Name", "Email", "City", "Region", "Country",
  "Source", "Language", "Timezone", "Device",
];

// Text starting with = + - @ would run as a formula in Sheets; keep it as text
function clean(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" && /^[=+\-@]/.test(value)) return "'" + value;
  return value;
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }

  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.purpose,
    data.name,
    data.email,
    data.city,
    data.region,
    data.country,
    data.source,
    data.language,
    data.timezone,
    data.device,
  ].map(clean));

  return ContentService.createTextOutput("ok");
}
