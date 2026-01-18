import { useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../../components/Navbar"
import { sampleOrders, getOrderStatusColor, getOrderStatusIcon } from "../../data/orders"
import jsPDF from "jspdf"

const Profile = () => {
    const [activeTab, setActiveTab] = useState("orders")
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [isDownloading, setIsDownloading] = useState(null)

    // Mock user data - replace with actual auth context
    const user = {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        joinDate: "2025-12-15",
        totalOrders: sampleOrders.length,
        membershipLevel: "Gold"
    }

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
    }

    const downloadInvoice = (order) => {
        setIsDownloading(order.id)
        // Small delay to show loading state
        setTimeout(() => {
            // Create new PDF document
            const doc = new jsPDF()

            // Set colors
            const primaryColor = [255, 107, 53] // #FF6B35
            const secondaryColor = [0, 78, 137] // #004E89
            const textColor = [26, 26, 26] // #1A1A1A

            // Calculate order details
            const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
            const tax = subtotal * 0.1 // 10% tax
            const shipping = order.total - subtotal - tax

            // Header - Company Name
            doc.setFillColor(...primaryColor)
            doc.rect(0, 0, 210, 40, "F")
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(28)
            doc.setFont("helvetica", "bold")
            doc.text("FreshExpress", 105, 25, { align: "center" })
            doc.setFontSize(12)
            doc.setFont("helvetica", "normal")
            doc.text("Premium Online Grocery Store", 105, 33, { align: "center" })

            // Order Title
            doc.setTextColor(...secondaryColor)
            doc.setFontSize(22)
            doc.setFont("helvetica", "bold")
            doc.text("Order Invoice", 20, 55)

            // Order Details Box
            doc.setTextColor(...textColor)
            doc.setFontSize(11)
            doc.setFont("helvetica", "normal")
            doc.text(`Order Number: ${order.id}`, 20, 70)
            doc.text(`Order Date: ${formatDate(order.date)}`, 20, 77)
            doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 20, 84)

            // Delivery Address
            doc.setFont("helvetica", "bold")
            doc.text("Delivery Address:", 20, 97)
            doc.setFont("helvetica", "normal")
            const addressLines = order.deliveryAddress.split(",")
            let addressY = 104
            addressLines.forEach((line) => {
                doc.text(line.trim(), 20, addressY)
                addressY += 7
            })

            // Order Items Table Header
            const startY = addressY + 10
            doc.setFillColor(...secondaryColor)
            doc.rect(20, startY, 170, 10, "F")
            doc.setTextColor(255, 255, 255)
            doc.setFont("helvetica", "bold")
            doc.setFontSize(10)
            doc.text("Item", 25, startY + 7)
            doc.text("Qty", 120, startY + 7)
            doc.text("Price", 145, startY + 7)
            doc.text("Total", 170, startY + 7)

            // Order Items
            doc.setTextColor(...textColor)
            doc.setFont("helvetica", "normal")
            let currentY = startY + 15
            order.items.forEach((item) => {
                if (currentY > 270) {
                    doc.addPage()
                    currentY = 20
                }
                doc.text(item.name, 25, currentY)
                doc.text(item.quantity.toString(), 125, currentY, { align: "center" })
                doc.text(`$${item.price.toFixed(2)}`, 150, currentY, { align: "center" })
                doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 175, currentY, { align: "center" })
                currentY += 7
            })

            // Summary
            currentY += 10
            doc.setDrawColor(200, 200, 200)
            doc.line(120, currentY, 190, currentY)

            currentY += 8
            doc.text("Subtotal:", 120, currentY)
            doc.text(`$${subtotal.toFixed(2)}`, 175, currentY, { align: "center" })

            currentY += 7
            doc.text("Tax (10%):", 120, currentY)
            doc.text(`$${tax.toFixed(2)}`, 175, currentY, { align: "center" })

            currentY += 7
            doc.text("Shipping:", 120, currentY)
            doc.text(shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`, 175, currentY, {
                align: "center"
            })

            currentY += 10
            doc.setDrawColor(...secondaryColor)
            doc.setLineWidth(0.5)
            doc.line(120, currentY, 190, currentY)

            currentY += 8
            doc.setFont("helvetica", "bold")
            doc.setFontSize(12)
            doc.text("Total:", 120, currentY)
            doc.setTextColor(...primaryColor)
            doc.text(`$${order.total.toFixed(2)}`, 175, currentY, { align: "center" })

            // Payment Method
            currentY += 15
            doc.setTextColor(...textColor)
            doc.setFontSize(10)
            doc.setFont("helvetica", "bold")
            doc.text("Payment Method:", 20, currentY)
            doc.setFont("helvetica", "normal")
            doc.text(order.paymentMethod || "Credit/Debit Card", 60, currentY)

            // Footer
            doc.setFontSize(9)
            doc.setTextColor(150, 150, 150)
            doc.text("Thank you for shopping with FreshExpress!", 105, 280, { align: "center" })
            doc.text("For support: support@freshexpress.com | +1 (555) 123-4567", 105, 286, { align: "center" })

            // Save PDF
            doc.save(`FreshExpress-Invoice-${order.id}.pdf`)
            setIsDownloading(null)
        }, 300)
    }

    return (
        <div className="min-h-screen bg-premium-background">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-premium-text mb-2">My Account</h1>
                    <p className="text-gray-600">Manage your profile and view your order history</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar - User Info */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-[--radius-card] shadow-md p-6 sticky top-24">
                            {/* Profile Picture Placeholder */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-premium-primary to-premium-accent rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3">
                                    {user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </div>
                                <h2 className="text-xl font-bold text-premium-text">{user.name}</h2>
                                <p className="text-sm text-gray-500">{user.membershipLevel} Member</p>
                            </div>

                            {/* User Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-2">
                                    <svg
                                        className="w-5 h-5 text-premium-secondary mt-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm text-premium-text">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg
                                        className="w-5 h-5 text-premium-secondary mt-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                    </svg>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm text-premium-text">{user.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg
                                        className="w-5 h-5 text-premium-secondary mt-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <div>
                                        <p className="text-xs text-gray-500">Member Since</p>
                                        <p className="text-sm text-premium-text">{formatDate(user.joinDate)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Total Orders</span>
                                    <span className="text-lg font-bold text-premium-primary">{user.totalOrders}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Member Points</span>
                                    <span className="text-lg font-bold text-premium-secondary">1,250</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <Link
                                to="/edit-profile"
                                className="w-full bg-premium-primary hover:bg-opacity-90 text-white py-2 rounded-[--radius-button] font-semibold mb-2 transition-all duration-200 block text-center">
                                Edit Profile
                            </Link>
                            <button className="w-full bg-white border-2 border-gray-300 hover:border-premium-secondary text-premium-text py-2 rounded-[--radius-button] font-semibold transition-all duration-200">
                                Log Out
                            </button>
                        </div>
                    </div>

                    {/* Main Content - Orders */}
                    <div className="lg:w-3/4">
                        {/* Tabs */}
                        <div className="bg-white rounded-[--radius-card] shadow-md mb-6">
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab("orders")}
                                    className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                                        activeTab === "orders"
                                            ? "text-premium-primary border-b-2 border-premium-primary"
                                            : "text-gray-500 hover:text-premium-secondary"
                                    }`}>
                                    Order History
                                </button>
                                <button
                                    onClick={() => setActiveTab("addresses")}
                                    className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                                        activeTab === "addresses"
                                            ? "text-premium-primary border-b-2 border-premium-primary"
                                            : "text-gray-500 hover:text-premium-secondary"
                                    }`}>
                                    Addresses
                                </button>
                                <button
                                    onClick={() => setActiveTab("payments")}
                                    className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                                        activeTab === "payments"
                                            ? "text-premium-primary border-b-2 border-premium-primary"
                                            : "text-gray-500 hover:text-premium-secondary"
                                    }`}>
                                    Payment Methods
                                </button>
                            </div>
                        </div>

                        {/* Orders List */}
                        {activeTab === "orders" && (
                            <div className="space-y-4">
                                {sampleOrders.length > 0 ? (
                                    sampleOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="bg-white rounded-[--radius-card] shadow-md overflow-hidden">
                                            {/* Order Header */}
                                            <div
                                                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => toggleOrderExpansion(order.id)}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-premium-text mb-1">
                                                            Order {order.id}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            Placed on {formatDate(order.date)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-premium-primary mb-1">
                                                            ${order.total.toFixed(2)}
                                                        </p>
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(
                                                                order.status
                                                            )}`}>
                                                            <span>{getOrderStatusIcon(order.status)}</span>
                                                            {order.status.charAt(0).toUpperCase() +
                                                                order.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quick Order Summary */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600">
                                                            {order.items.length} item
                                                            {order.items.length !== 1 ? "s" : ""}
                                                        </span>
                                                        <span className="text-gray-300">•</span>
                                                        <div className="flex -space-x-2">
                                                            {order.items.slice(0, 4).map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                                                                    <span className="text-sm">{item.icon}</span>
                                                                </div>
                                                            ))}
                                                            {order.items.length > 4 && (
                                                                <div className="w-8 h-8 bg-premium-primary text-white rounded-full flex items-center justify-center border-2 border-white text-xs font-bold">
                                                                    +{order.items.length - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <svg
                                                        className={`w-5 h-5 text-gray-400 transition-transform ${
                                                            expandedOrder === order.id ? "transform rotate-180" : ""
                                                        }`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Expanded Order Details */}
                                            {expandedOrder === order.id && (
                                                <div className="border-t border-gray-200 p-6 bg-gray-50">
                                                    {/* Order Items */}
                                                    <div className="mb-6">
                                                        <h4 className="font-semibold text-premium-text mb-3">
                                                            Order Items
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {order.items.map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between bg-white p-3 rounded-lg">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                            <span className="text-2xl">
                                                                                {item.icon}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold text-premium-text">
                                                                                {item.name}
                                                                            </p>
                                                                            <p className="text-sm text-gray-500">
                                                                                Qty: {item.quantity} × ${item.price}/
                                                                                {item.unit}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="font-bold text-premium-primary">
                                                                        ${(item.quantity * item.price).toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Delivery Info */}
                                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                                        <div className="bg-white p-4 rounded-lg">
                                                            <h4 className="font-semibold text-premium-text mb-2">
                                                                Delivery Address
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {order.deliveryAddress}
                                                            </p>
                                                        </div>
                                                        <div className="bg-white p-4 rounded-lg">
                                                            <h4 className="font-semibold text-premium-text mb-2">
                                                                Delivery Date
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {order.deliveryDate
                                                                    ? formatDate(order.deliveryDate)
                                                                    : order.estimatedDelivery
                                                                    ? `Estimated: ${formatDate(
                                                                          order.estimatedDelivery
                                                                      )}`
                                                                    : "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Order Actions */}
                                                    <div className="flex justify-center gap-3">
                                                        {order.status === "processing" && (
                                                            <button className="flex-1 bg-premium-accent hover:bg-opacity-90 text-white py-2 px-4 rounded-[--radius-button] font-semibold transition-all duration-200">
                                                                Cancel Order
                                                            </button>
                                                        )}
                                                        {order.status !== "cancelled" && (
                                                            <button
                                                                onClick={() => downloadInvoice(order)}
                                                                disabled={isDownloading === order.id}
                                                                className="px-6 bg-premium-accent hover:bg-opacity-90 text-white py-2 rounded-[--radius-button] font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                {isDownloading === order.id ? (
                                                                    <>
                                                                        <svg
                                                                            className="animate-spin h-5 w-5"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24">
                                                                            <circle
                                                                                className="opacity-25"
                                                                                cx="12"
                                                                                cy="12"
                                                                                r="10"
                                                                                stroke="currentColor"
                                                                                strokeWidth="4"></circle>
                                                                            <path
                                                                                className="opacity-75"
                                                                                fill="currentColor"
                                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Generating...
                                                                    </>
                                                                ) : (
                                                                    <>
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
                                                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                            />
                                                                        </svg>
                                                                        Download Invoice
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-[--radius-card] shadow-md p-12 text-center">
                                        <div className="text-6xl mb-4">📦</div>
                                        <h3 className="text-xl font-bold text-premium-text mb-2">No Orders Yet</h3>
                                        <p className="text-gray-600 mb-6">
                                            Start shopping to see your order history here
                                        </p>
                                        <Link
                                            to="/"
                                            className="inline-block bg-premium-primary hover:bg-opacity-90 text-white px-8 py-3 rounded-[--radius-button] font-semibold transition-all duration-200">
                                            Start Shopping
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Addresses Tab */}
                        {activeTab === "addresses" && (
                            <div className="bg-white rounded-[--radius-card] shadow-md p-8 text-center">
                                <div className="text-6xl mb-4">🏠</div>
                                <h3 className="text-xl font-bold text-premium-text mb-2">Saved Addresses</h3>
                                <p className="text-gray-600 mb-6">Your delivery addresses will appear here</p>
                                <button className="bg-premium-primary hover:bg-opacity-90 text-white px-8 py-3 rounded-[--radius-button] font-semibold transition-all duration-200">
                                    Add New Address
                                </button>
                            </div>
                        )}

                        {/* Payment Methods Tab */}
                        {activeTab === "payments" && (
                            <div className="bg-white rounded-[--radius-card] shadow-md p-8 text-center">
                                <div className="text-6xl mb-4">💳</div>
                                <h3 className="text-xl font-bold text-premium-text mb-2">Payment Methods</h3>
                                <p className="text-gray-600 mb-6">Your saved payment methods will appear here</p>
                                <button className="bg-premium-primary hover:bg-opacity-90 text-white px-8 py-3 rounded-[--radius-button] font-semibold transition-all duration-200">
                                    Add Payment Method
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-premium-secondary text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="font-semibold">FreshExpress - Premium Online Grocery Store</p>
                    <p className="text-sm opacity-80 mt-2">© 2026 FreshExpress. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

export default Profile
