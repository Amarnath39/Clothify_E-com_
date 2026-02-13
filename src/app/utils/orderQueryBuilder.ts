export const buildOrderQuery = async (filters: any) => {
    const query: any = {};

    if (filters.search) {
        const regex = new RegExp(filters.search, "i");
        query.$or = [
            { orderId: regex },
            { transactionId: regex },
            // Note: product name and user name search would require extra logic here
            // which might be overkill for simple exports, but we can add if needed.
        ];
    }

    if (filters.paymentStatus) {
        query.paymentStatus = new RegExp(filters.paymentStatus, "i");
    }

    if (filters.orderStatus) {
        query.currentStatus = new RegExp(filters.orderStatus, "i");
    }

    if (filters.orderSource && filters.orderSource !== "all") {
        if (filters.orderSource === "offline") {
            query.$or = [
                { order_type: "OFFLINE" },
                { orderSource: "ADMIN_OFFLINE" },
            ];
        } else if (filters.orderSource === "online") {
            query.order_type = { $nin: ["POS", "OFFLINE"] };
            query.orderSource = { $ne: "ADMIN_OFFLINE" };
        } else if (filters.orderSource === "pos") {
            query.order_type = "POS";
        }
    }

    if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) {
            const eDate = new Date(filters.endDate);
            eDate.setHours(eDate.getHours() + 24);
            query.date.$lte = eDate;
        }
    }

    return query;
};
