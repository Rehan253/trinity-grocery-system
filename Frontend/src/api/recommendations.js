import { sendGet, sendPost } from "./generic"

export const getRecommendations = (userId) => {
    return sendGet(`recommendations/${userId}`)
}

export const syncProductsToAlgolia = () => {
    return sendPost("recommendations/sync-products", {})
}
