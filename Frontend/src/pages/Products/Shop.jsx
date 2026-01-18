import { useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../../components/Navbar"
import { PromoCarousel } from "../../components/PromoCarousel"
import { CategorySidebar, ProductGrid } from "../../components/Products"
import { CartSidebar } from "../../components/Cart"
import { useCart } from "../../context/CartContext"
import { sampleProducts } from "../../data/products"

const Shop = () => {
    const { addToCart } = useCart()
    const [selectedCategory, setSelectedCategory] = useState("All")

    const handleAddToCart = (product) => {
        addToCart(product)
        console.log("Added to cart:", product)
    }

    const handleCategorySelect = (category) => {
        setSelectedCategory(category)
    }

    return (
        <div className="min-h-screen bg-premium-background">
            {/* Navbar Component */}
            <Navbar />

            {/* Promotional Carousel */}
            <PromoCarousel />

            {/* Cart Sidebar */}
            <CartSidebar />

            {/* Main Content - Two Column Layout */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar - 20% width on desktop */}
                    <div className="w-full lg:w-1/5 lg:min-w-[250px]">
                        <CategorySidebar onCategorySelect={handleCategorySelect} />
                    </div>

                    {/* Right Content - Product Grid - 80% width on desktop */}
                    <div className="w-full lg:w-4/5">
                        <ProductGrid
                            products={sampleProducts}
                            selectedCategory={selectedCategory}
                            onAddToCart={handleAddToCart}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-premium-secondary text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
                        <div>
                            <h3
                                className="font-bold text-xl mb-4"
                                style={{ fontFamily: "'Poppins', sans-serif" }}>
                                FreshExpress
                            </h3>
                            <p className="text-sm opacity-90">
                                Your trusted partner for fresh groceries delivered fast
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3">Quick Links</h4>
                            <ul className="space-y-2 text-sm opacity-90">
                                <li>
                                    <Link
                                        to="/about"
                                        className="hover:text-premium-primary transition-colors">
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/contact"
                                        className="hover:text-premium-primary transition-colors">
                                        Contact
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/faq"
                                        className="hover:text-premium-primary transition-colors">
                                        FAQ
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/delivery-info"
                                        className="hover:text-premium-primary transition-colors">
                                        Delivery Info
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3">Categories</h4>
                            <ul className="space-y-2 text-sm opacity-90">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-premium-primary transition-colors">
                                        Fruits & Vegetables
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-premium-primary transition-colors">
                                        Dairy Products
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-premium-primary transition-colors">
                                        Bakery Items
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-premium-primary transition-colors">
                                        Meat & Seafood
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3">Contact Us</h4>
                            <ul className="space-y-2 text-sm opacity-90">
                                <li>📞 +1 (555) 123-4567</li>
                                <li>📧 info@freshexpress.com</li>
                                <li>📍 123 Market St, City</li>
                                <li>🕒 Mon-Sat: 7AM - 10PM</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/20 pt-6 text-center text-sm opacity-80">
                        <p>
                            © 2026 FreshExpress - Premium Online Grocery Store. Built with React + Vite + Tailwind CSS
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Shop
