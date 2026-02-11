export const flattenOrder = (order: any) => {
    return {
        orderId: order.orderId,
        totalPrice: order.totalPrice,
        payablePrice: order.payablePrice,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        payerEmail: order.payerEmail,
        orderType: order.order_type,
        productCount: order.productDetails?.length || 0,
        firstProductId: order.productDetails?.[0]?.product?.toString(),
        createdAt: order.createdAt,
        currentStatus: order.currentStatus,
        trackingId: order.trackingId,
        deliveryPartner: order.deliveryPartner,
        shippingAddressName: order.shippingAddress?.name,
        shippingAddressPhone: order.shippingAddress?.mobile,
        shippingAddressCity: order.shippingAddress?.city,
    };
};
