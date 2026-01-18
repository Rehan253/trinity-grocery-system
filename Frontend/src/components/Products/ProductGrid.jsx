import ProductCard from "./ProductCard"

const ProductGrid = ({ products, onAddToCart, selectedCategory }) => {
    // Filter products by category
    const filteredProducts =
        selectedCategory === "All" ? products : products.filter((product) => product.category === selectedCategory)

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-premium-text">
                        {selectedCategory === "All" ? "All Products" : selectedCategory}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{filteredProducts.length} products available</p>
                </div>

                {/* Sort Dropdown */}
                <select className="px-4 py-2 border-2 border-gray-300 rounded-[--radius-button] text-sm font-medium text-premium-text focus:border-premium-primary focus:outline-none">
                    <option>Sort by: Featured</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Name: A-Z</option>
                    <option>Newest</option>
                </select>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-premium-text mb-2">No products found</h3>
                    <p className="text-gray-500">Try selecting a different category</p>
                </div>
            )}
        </div>
    )
}

export default ProductGrid
