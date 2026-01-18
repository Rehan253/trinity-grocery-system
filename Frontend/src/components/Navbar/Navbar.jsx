import { useState } from "react"
import { Link } from "react-router-dom"
import { useCart } from "../../context/CartContext"

const Navbar = () => {
    const { cartCount, toggleCart } = useCart()
    const [searchQuery, setSearchQuery] = useState("")
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const categories = [
        { name: "Fruits", icon: "🍎" },
        { name: "Vegetables", icon: "🥕" },
        { name: "Dairy", icon: "🥛" },
        { name: "Bakery", icon: "🍞" },
        { name: "Meat", icon: "🥩" },
        { name: "Seafood", icon: "🐟" },
        { name: "Beverages", icon: "🥤" },
        { name: "Snacks", icon: "🍿" }
    ]

    const handleSearch = (e) => {
        e.preventDefault()
        console.log("Searching for:", searchQuery)
        // Add your search logic here
    }

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            {/* Main Navbar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Left - Brand Name */}
                    <div className="flex-shrink-0">
                        <h1
                            className="text-premium-secondary font-bold text-2xl sm:text-3xl"
                            style={{ fontFamily: "'Poppins', sans-serif" }}>
                            FreshExpress
                        </h1>
                    </div>

                    {/* Center - Search Bar (Hidden on mobile) */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-8">
                        <form
                            onSubmit={handleSearch}
                            className="w-full">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for products..."
                                    className="w-full px-6 py-3 pr-12 rounded-[30px] border-2 border-gray-300 focus:border-premium-primary focus:outline-none transition-colors duration-200"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-premium-primary hover:bg-opacity-90 text-white p-2 rounded-full transition-all duration-200">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right - Profile & Cart Icons */}
                    <div className="flex items-center gap-4">
                        {/* Profile Icon */}
                        <Link
                            to="/profile"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7 text-premium-text"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </Link>

                        {/* Cart Icon */}
                        <button
                            onClick={toggleCart}
                            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7 text-premium-text"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-premium-primary text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </button>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <svg
                                className="h-6 w-6 text-premium-text"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                {isMobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="md:hidden pb-4">
                    <form
                        onSubmit={handleSearch}
                        className="w-full">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for products..."
                                className="w-full px-6 py-3 pr-12 rounded-[30px] border-2 border-gray-300 focus:border-premium-primary focus:outline-none transition-colors duration-200"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-premium-primary hover:bg-opacity-90 text-white p-2 rounded-full transition-all duration-200">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Category Bar */}
            <div className="bg-premium-background border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Desktop Categories */}
                    <div className="hidden md:flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide">
                        {categories.map((category) => (
                            <button
                                key={category.name}
                                className="flex items-center gap-2 px-4 py-2 rounded-[--radius-button] hover:bg-premium-primary hover:text-white text-premium-text font-medium transition-all duration-200 whitespace-nowrap transform hover:scale-105">
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Mobile Categories (Collapsible) */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden py-3 grid grid-cols-2 gap-2 animate-fadeIn">
                            {categories.map((category) => (
                                <button
                                    key={category.name}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-[--radius-card] bg-white hover:bg-premium-primary hover:text-white text-premium-text font-medium transition-all duration-200 transform hover:scale-105">
                                    <span>{category.icon}</span>
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
