import { csvItemColumns } from "../../constants/csv-columns";
import { HttpError } from "../../utils/httpError";
import { IItem } from "./item.model";
const xlsx = require("xlsx");
import csv from "csvtojson";


export const getRegexedSKU = (sku: string) => {
  return new RegExp(
    `^${sku.replace(/\+/g, "\\+").replace(/ /g, "\\s")}(?:_?[xX][1-9][0-9]*)?$`,
    "i"
  );
};

export const extractItemsFromCsv = (items: any) => {
  const itemsData = items.map((item: any) => {
    const {
      name,
      sku,
      items,
      parcels,
      "length(item)": length,
      "width(item)": width,
      "height(item)": height,
      "weight(g)": weight,
      "boxLength(cm)": boxLength,
      "boxWidth(cm)": boxWidth,
      "boxHeight(cm)": boxHeight,
      class: classType,
      "maxParcel" : maxParcels,
      quantity,
    } = item;
    return {
      name,
      sku,
      items,
      parcels,
      length,
      width,
      height,
      weight,
      boxLength,
      boxWidth,
      boxHeight,
      class: classType.trim().slice(6, 7),
      maxParcels: isNaN(maxParcels) ? 0 : maxParcels,
      qty: Number(quantity),
    };
  });

  return itemsData;
};

export const validateFileType = (file: Express.Multer.File): void => {
  const fileExtension = file.originalname.split(".").pop();
  if (!["csv", "xlsx", "xls"].includes(fileExtension!)) {
    throw new HttpError(400, "Please upload a CSV or xlsx file.");
  }
};


export const handleFileHeaders = (headers: string[] | null, fileType: string): void => {
  if (!headers) {
    throw new HttpError(400, `Failed to read ${fileType} headers.`);
  }

  const missingColumns = csvItemColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new HttpError(400, `Missing columns: ${missingColumns.join(", ")}`);
  }
};

export const processCsvFile = async (file: Express.Multer.File): Promise<any[]> => {
  const csvContent = file.buffer.toString();
  const data = await csv().fromString(csvContent);
  return data;
};

export const processExcelFile = (file: Express.Multer.File): any[] => {
  const workbook = xlsx.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet, {
    header: 1, defval: '', blankrows: true, raw: false, dateNF: 'd"/"m"/"yyyy'
  });

  const headers = jsonData[0];
  handleFileHeaders(headers, "Excel");

  return jsonData.slice(1).map((row: any[]) => {
    const obj: { [key: string]: any } = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index];
    });
    return obj;
  });
};