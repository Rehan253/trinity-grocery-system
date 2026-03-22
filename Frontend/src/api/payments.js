import { sendPost } from "./generic"

export const createPaypalOrder = (invoiceId) => {
    return sendPost("payments/paypal/create-order", { invoice_id: invoiceId })
}

export const capturePaypalOrder = (invoiceId, orderId) => {
    return sendPost("payments/paypal/capture-order", { invoice_id: invoiceId, order_id: orderId })
}
