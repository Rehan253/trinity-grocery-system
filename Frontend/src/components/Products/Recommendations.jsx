import { useCallback, useEffect, useMemo, useState } from "react"
import { getRecommendations } from "../../api/recommendations"

const toProductView = (recommendation, productFromStore) => {
    if (productFromStore) {
        return productFromStore
    }

    const parsedId = Number(recommendation.objectID)
    return {
        id: Number.isNaN(parsedId) ? recommendation.objectID : parsedId,
        name: recommendation.name || "Recommended Product",
        brand: recommendation.brand || "",
        category: recommendation.category || "General",
        price: Number(recommendation.price || 0),
        image: recommendation.picture_url || "",
        picture_url: recommendation.picture_url || "",
        description: "Recommended for your next order",
        stock: 999,
        unit: "unit",
    }
}

const Recommendations = ({ userId, isAuthenticated, products, onAddToCart, onProductClick, maxItems = 6 }) => {
    const [recommendations, setRecommendations] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const productsById = useMemo(() => {
        const map = new Map()
        products.forEach((product) => {
            map.set(String(product.id), product)
        })
        return map
    }, [products])

    const hydratedRecommendations = useMemo(() => {
        return recommendations
            .map((rec) => toProductView(rec, productsById.get(String(rec.objectID))))
            .slice(0, maxItems)
    }, [recommendations, productsById, maxItems])

    const loadRecommendations = useCallback(async () => {
        if (!isAuthenticated || !userId) {
            setRecommendations([])
            setError("")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const response = await getRecommendations(userId)
            if (response?.status === "Error") {
                setError(response.errorMessage || "Failed to load recommendations")
                setRecommendations([])
            } else {
                setRecommendations(Array.isArray(response?.recommendations) ? response.recommendations : [])
            }
        } catch (err) {
            setError(err?.message || "Failed to load recommendations")
            setRecommendations([])
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, userId])

    useEffect(() => {
        loadRecommendations()
    }, [loadRecommendations])

    return (
        <section className="mb-8 rounded-[--radius-card] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-premium-text">Recommended for You</h2>
                    <p className="text-sm text-gray-500">Dummy recommendation widget for step 10 testing</p>
                </div>
                {isAuthenticated && (
                    <button
                        type="button"
                        onClick={loadRecommendations}
                        className="rounded-md bg-premium-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-opacity-90">
                        Refresh
                    </button>
                )}
            </div>

            {!isAuthenticated && (
                <p className="text-sm text-gray-600">Log in to test personalized recommendations.</p>
            )}

            {isAuthenticated && isLoading && (
                <div className="py-6 text-sm text-gray-600">Loading recommendations...</div>
            )}

            {isAuthenticated && error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            {isAuthenticated && !isLoading && !error && hydratedRecommendations.length === 0 && (
                <p className="py-6 text-sm text-gray-600">
                    No recommendations yet. Complete one paid order, then refresh.
                </p>
            )}

            {isAuthenticated && hydratedRecommendations.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {hydratedRecommendations.map((product) => (
                        <article
                            key={product.id}
                            className="cursor-pointer rounded-lg border border-gray-200 p-4 transition hover:shadow-md"
                            onClick={() => onProductClick?.(product)}>
                            <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-lg font-semibold text-gray-500">{product.icon || "ITEM"}</span>
                                )}
                            </div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-premium-primary">
                                {product.category || "General"}
                            </p>
                            <h3 className="mb-2 line-clamp-2 text-base font-bold text-premium-text">{product.name}</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-premium-secondary">${product.price}</span>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onAddToCart?.(product)
                                    }}
                                    className="rounded-md bg-premium-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-opacity-90">
                                    Add
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

export default Recommendations
