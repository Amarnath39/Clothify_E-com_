import ExcelJS from "exceljs";
import Order from "@/model/Order";
import { buildOrderQuery } from "@/app/utils/orderQueryBuilder";
import { flattenOrder } from "@/app/utils/orderFlattener";

export async function exportOrdersToExcel(filters: any, fields: string[]) {
    const query = await buildOrderQuery(filters);

    // STREAM cursor for large datasets
    const cursor = Order.find(query).cursor();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Orders");

    // Columns
    sheet.columns = fields.map((f) => ({
        header: f,
        key: f,
        width: 25,
    }));

    for await (const order of cursor) {
        const flat = flattenOrder(order);
        sheet.addRow(flat);
    }

    return await workbook.xlsx.writeBuffer();
}
