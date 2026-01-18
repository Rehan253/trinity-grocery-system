import { useState } from "react"

const CategorySidebar = ({ onCategorySelect }) => {
    const [selectedCategory, setSelectedCategory] = useState("All")

    const categories = [
        { name: "All", icon: "🛒", count: 156 },
        { name: "Fruits", icon: "🍎", count: 24 },
        { name: "Vegetables", icon: "🥕", count: 32 },
        { name: "Dairy", icon: "🥛", count: 18 },
        { name: "Bakery", icon: "🍞", count: 15 },
        { name: "Meat", icon: "🥩", count: 12 },
        { name: "Seafood", icon: "🐟", count: 10 },
        { name: "Beverages", icon: "🥤", count: 28 },
        { name: "Snacks", icon: "🍿", count: 17 }
    ]

    const handleCategoryClick = (categoryName) => {
        setSelectedCategory(categoryName)
        if (onCategorySelect) {
            onCategorySelect(categoryName)
        }
    }

    return (
        <aside className="w-full">
            <div className="bg-white rounded-[--radius-card] shadow-md overflow-hidden sticky top-24">
                {/* Sidebar Header */}
                <div className="bg-premium-secondary text-white p-4">
                    <h2 className="text-lg font-bold">Categories</h2>
                    <p className="text-xs opacity-90">Browse by category</p>
                </div>

                {/* Category List */}
                <div className="p-2">
                    {categories.map((category) => (
                        <button
                            key={category.name}
                            onClick={() => handleCategoryClick(category.name)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg mb-1 transition-all duration-200 ${
                                selectedCategory === category.name
                                    ? "bg-premium-primary text-white shadow-md transform scale-105"
                                    : "hover:bg-premium-background text-premium-text"
                            }`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{category.icon}</span>
                                <span className="font-semibold text-left">{category.name}</span>
                            </div>
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                    selectedCategory === category.name
                                        ? "bg-white text-premium-primary"
                                        : "bg-premium-background text-premium-text"
                                }`}>
                                {category.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    )
}

export default CategorySidebar
