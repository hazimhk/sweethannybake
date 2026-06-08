const SPREADSHEET_NAME = "Swee Hanny Bake Orders";
const ORDERS_SHEET = "Orders";
const ITEMS_SHEET = "Order Items";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const spreadsheet = getOrCreateSpreadsheet();
    const ordersSheet = getOrCreateSheet(spreadsheet, ORDERS_SHEET, [
      "Order ID",
      "Created At",
      "Customer Name",
      "Phone",
      "Pickup Date",
      "Pickup / Delivery Note",
      "Notes",
      "Status",
      "Total",
    ]);
    const itemsSheet = getOrCreateSheet(spreadsheet, ITEMS_SHEET, [
      "Order ID",
      "Item Name",
      "Quantity",
      "Price Each",
      "Subtotal",
    ]);

    ordersSheet.appendRow([
      payload.orderId,
      payload.createdAt,
      payload.customerName,
      payload.customerPhone,
      payload.pickupDate,
      payload.customerAddress,
      payload.notes,
      payload.status || "New",
      payload.total,
    ]);

    payload.items.forEach(function (item) {
      itemsSheet.appendRow([
        payload.orderId,
        item.name,
        item.quantity,
        item.price,
        item.subtotal,
      ]);
    });

    return jsonResponse({
      ok: true,
      orderId: payload.orderId,
      spreadsheetUrl: spreadsheet.getUrl(),
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message,
    });
  }
}

function setup() {
  const spreadsheet = getOrCreateSpreadsheet();
  getOrCreateSheet(spreadsheet, ORDERS_SHEET, [
    "Order ID",
    "Created At",
    "Customer Name",
    "Phone",
    "Pickup Date",
    "Pickup / Delivery Note",
    "Notes",
    "Status",
    "Total",
  ]);
  getOrCreateSheet(spreadsheet, ITEMS_SHEET, [
    "Order ID",
    "Item Name",
    "Quantity",
    "Price Each",
    "Subtotal",
  ]);
  Logger.log(spreadsheet.getUrl());
}

function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return SpreadsheetApp.create(SPREADSHEET_NAME);
}

function getOrCreateSheet(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
