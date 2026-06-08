const SPREADSHEET_NAME = "Swee Hanny Bake Orders";
const ORDERS_SHEET = "Orders";
const ITEMS_SHEET = "Order Items";

const ORDER_HEADERS = [
  "Order ID",
  "Created At",
  "Customer Name",
  "Phone",
  "Email",
  "Pickup Date",
  "Pickup / Delivery Note",
  "Notes",
  "Order Status",
  "Payment Method",
  "Payment Status",
  "Receipt Sent",
  "Receipt Sent At",
  "WhatsApp Receipt Link",
  "Total",
];

const ITEM_HEADERS = [
  "Order ID",
  "Item Name",
  "Quantity",
  "Price Each",
  "Subtotal",
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const spreadsheet = getOrCreateSpreadsheet();
    const ordersSheet = getOrCreateSheet(spreadsheet, ORDERS_SHEET, ORDER_HEADERS);
    const itemsSheet = getOrCreateSheet(spreadsheet, ITEMS_SHEET, ITEM_HEADERS);
    const orderId = payload.orderId || "SHB-" + Date.now();
    const paymentStatus = payload.paymentStatus || "Pending Payment";
    const orderStatus = payload.orderStatus || "New";

    appendByHeaders(ordersSheet, {
      "Order ID": orderId,
      "Created At": payload.createdAt || new Date().toISOString(),
      "Customer Name": payload.customerName || "",
      "Phone": payload.customerPhone || "",
      "Email": payload.customerEmail || "",
      "Pickup Date": payload.pickupDate || "",
      "Pickup / Delivery Note": payload.customerAddress || "",
      "Notes": payload.notes || "",
      "Order Status": orderStatus,
      "Payment Method": payload.paymentMethod || "Static QR",
      "Payment Status": paymentStatus,
      "Receipt Sent": "No",
      "Receipt Sent At": "",
      "WhatsApp Receipt Link": buildWhatsAppReceiptLink(payload.customerPhone, {
        orderId,
        customerName: payload.customerName,
        total: payload.total,
        paymentStatus,
      }),
      "Total": payload.total || 0,
    });

    (payload.items || []).forEach(function (item) {
      appendByHeaders(itemsSheet, {
        "Order ID": orderId,
        "Item Name": item.name,
        "Quantity": item.quantity,
        "Price Each": item.price,
        "Subtotal": item.subtotal,
      });
    });

    return jsonResponse({
      ok: true,
      orderId,
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
  getOrCreateSheet(spreadsheet, ORDERS_SHEET, ORDER_HEADERS);
  getOrCreateSheet(spreadsheet, ITEMS_SHEET, ITEM_HEADERS);
  ensurePaidReceiptTrigger(spreadsheet);
  Logger.log(spreadsheet.getUrl());
}

function handlePaidEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== ORDERS_SHEET) return;

  const headers = getHeaders(sheet);
  const paymentStatusCol = headers.indexOf("Payment Status") + 1;
  if (e.range.getColumn() !== paymentStatusCol) return;

  const newValue = String(e.value || "").trim().toLowerCase();
  if (newValue !== "paid") return;

  const row = e.range.getRow();
  if (row <= 1) return;

  const rowData = getRowObject(sheet, row);
  if (String(rowData["Receipt Sent"] || "").toLowerCase() === "yes") return;

  const spreadsheet = sheet.getParent();
  const items = getItemsForOrder(spreadsheet, rowData["Order ID"]);
  const receiptText = buildReceiptText(rowData, items);

  if (rowData.Email) {
    MailApp.sendEmail({
      to: rowData.Email,
      subject: "Receipt for " + rowData["Order ID"],
      body: receiptText,
    });
  }

  setCellByHeader(sheet, row, "Receipt Sent", rowData.Email ? "Yes" : "No email");
  setCellByHeader(sheet, row, "Receipt Sent At", new Date());
  setCellByHeader(sheet, row, "Order Status", "Paid");
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
    return sheet;
  }

  const existing = getHeaders(sheet);
  const missing = headers.filter(function (header) {
    return existing.indexOf(header) === -1;
  });

  if (missing.length > 0) {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }

  sheet.setFrozenRows(1);
  return sheet;
}

function appendByHeaders(sheet, values) {
  const headers = getHeaders(sheet);
  const row = headers.map(function (header) {
    return values[header] !== undefined ? values[header] : "";
  });
  sheet.appendRow(row);
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function getRowObject(sheet, rowNumber) {
  const headers = getHeaders(sheet);
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  return headers.reduce(function (object, header, index) {
    object[header] = values[index];
    return object;
  }, {});
}

function setCellByHeader(sheet, rowNumber, header, value) {
  const headers = getHeaders(sheet);
  const column = headers.indexOf(header) + 1;
  if (column > 0) {
    sheet.getRange(rowNumber, column).setValue(value);
  }
}

function getItemsForOrder(spreadsheet, orderId) {
  const sheet = spreadsheet.getSheetByName(ITEMS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const headers = getHeaders(sheet);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return rows
    .map(function (row) {
      return headers.reduce(function (object, header, index) {
        object[header] = row[index];
        return object;
      }, {});
    })
    .filter(function (item) {
      return item["Order ID"] === orderId;
    });
}

function buildReceiptText(order, items) {
  const itemLines = items.map(function (item) {
    return "- " + item.Quantity + "x " + item["Item Name"] + " (RM " + Number(item.Subtotal).toFixed(2) + ")";
  });

  return [
    "Swee Hanny Bake Receipt",
    "",
    "Order ID: " + order["Order ID"],
    "Name: " + order["Customer Name"],
    "Phone: " + order.Phone,
    "Pickup / Delivery Date: " + order["Pickup Date"],
    "Payment Status: Paid",
    "",
    "Items:",
    itemLines.join("\n"),
    "",
    "Total: RM " + Number(order.Total).toFixed(2),
    "",
    "Thank you for your order.",
  ].join("\n");
}

function buildWhatsAppReceiptLink(phone, order) {
  const normalizedPhone = String(phone || "").replace(/[^\d]/g, "");
  if (!normalizedPhone) return "";

  const message = [
    "Hi " + (order.customerName || "") + ",",
    "Payment received for order " + order.orderId + ".",
    "Total: RM " + Number(order.total || 0).toFixed(2),
    "Status: " + order.paymentStatus,
    "",
    "Thank you, Swee Hanny Bake.",
  ].join("\n");

  return "https://wa.me/" + normalizedPhone + "?text=" + encodeURIComponent(message);
}

function ensurePaidReceiptTrigger(spreadsheet) {
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some(function (trigger) {
    return trigger.getHandlerFunction() === "handlePaidEdit";
  });

  if (!exists) {
    ScriptApp.newTrigger("handlePaidEdit")
      .forSpreadsheet(spreadsheet)
      .onEdit()
      .create();
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
