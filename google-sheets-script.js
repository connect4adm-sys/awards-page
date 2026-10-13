/**
 * ============================================================
 * EDUCATION MENTOR AWARDS 2026-2027 — GOOGLE APPS SCRIPT WEBHOOK
 * ============================================================
 * 
 * INSTRUCTIONS TO CONNECT GOOGLE SHEET:
 * 1. Open your Google Sheet (create a blank one at sheets.new).
 * 2. Rename the sheet tab to "Nominations" (or leave as default Sheet1).
 * 3. In the top menu, click: Extensions → Apps Script.
 * 4. Delete any code in the editor, and paste this ENTIRE code block.
 * 5. Click "Save" (Disk icon or Ctrl+S).
 * 6. In the top right corner, click: Deploy → New deployment.
 * 7. Click the gear icon (⚙️) next to "Select type" and choose "Web app".
 * 8. Set the settings:
 *    - Description: Education Mentor Awards Webhook 2026-2027
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (IMPORTANT: must be "Anyone" so the landing page can post)
 * 9. Click "Deploy", approve permissions ("Advanced" → "Go to Education Mentor Awards (unsafe)" → "Allow").
 * 10. Copy the "Web app URL" (ends in /exec).
 * 11. Open your Admin Portal (awards.mymentorcircle.com/admin), click "Google Sheet", paste the URL, and click "Save Webhook"!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Ensure Sheet Headers Exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "ID",
        "Full Name",
        "Role",
        "School / Institution",
        "City",
        "Email",
        "Phone",
        "Award Category",
        "Review Status"
      ]);
      
      // Luxury Styling for Header Row
      var headerRange = sheet.getRange(1, 1, 1, 10);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0b111c");
      headerRange.setFontColor("#dfba73");
      headerRange.setFontFamily("Arial");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No payload received"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var payload = JSON.parse(e.postData.contents);
    
    // Support Batch Sync (Array of nominations from Admin Dashboard)
    if (Array.isArray(payload)) {
      var rows = [];
      for (var i = 0; i < payload.length; i++) {
        var item = payload[i];
        rows.push([
          item.created_at || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          item.id || "",
          item.full_name || item.fullName || "",
          item.role || "",
          item.school || "",
          item.city || "",
          item.email || "",
          item.phone || "",
          item.category || "",
          item.status || "Pending"
        ]);
      }
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 10).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: rows.length,
        message: rows.length + " nominations synced successfully"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Support Single Submission (From Landing Page Form)
    sheet.appendRow([
      payload.created_at || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      payload.id || "",
      payload.full_name || payload.fullName || "",
      payload.role || "",
      payload.school || "",
      payload.city || "",
      payload.email || "",
      payload.phone || "",
      payload.category || "",
      payload.status || "Pending"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Nomination appended to Google Sheet"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var result = [];
    
    if (data && data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row[0] && !row[2]) continue;
        result.push({
          created_at: row[0] ? String(row[0]) : "",
          id: row[1] || ("GS-" + i),
          full_name: row[2] || "Nominee",
          role: row[3] || "Principal",
          school: row[4] || "",
          city: row[5] || "",
          email: row[6] || "",
          phone: row[7] || "",
          category: row[8] || "",
          status: row[9] || "Pending"
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      status: "active",
      count: result.length,
      data: result,
      service: "Education Mentor Awards Google Sheet Sync 2026-2027",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
