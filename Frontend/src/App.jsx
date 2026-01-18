import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import {
    Shop,
    Login,
    Signup,
    Profile,
    EditProfile,
    DeliveryAddress,
    Payment,
    OrderConfirmation,
    AboutUs,
    Contact,
    FAQ,
    DeliveryInfo,
    UserManagement,
    ProductManagement
} from "./pages"
import { CartProvider } from "./context/CartContext"

function App() {
    return (
        <CartProvider>
            <Router>
                <Routes>
                    {/* Shop */}
                    <Route
                        path="/"
                        element={<Shop />}
                    />

                    {/* Auth */}
                    <Route
                        path="/login"
                        element={<Login />}
                    />
                    <Route
                        path="/signup"
                        element={<Signup />}
                    />

                    {/* User Profile */}
                    <Route
                        path="/profile"
                        element={<Profile />}
                    />
                    <Route
                        path="/edit-profile"
                        element={<EditProfile />}
                    />

                    {/* Checkout Flow */}
                    <Route
                        path="/checkout/delivery"
                        element={<DeliveryAddress />}
                    />
                    <Route
                        path="/checkout/payment"
                        element={<Payment />}
                    />
                    <Route
                        path="/checkout/confirmation"
                        element={<OrderConfirmation />}
                    />

                    {/* Info Pages */}
                    <Route
                        path="/about"
                        element={<AboutUs />}
                    />
                    <Route
                        path="/contact"
                        element={<Contact />}
                    />
                    <Route
                        path="/faq"
                        element={<FAQ />}
                    />
                    <Route
                        path="/delivery-info"
                        element={<DeliveryInfo />}
                    />

                    {/* Admin Pages */}
                    <Route
                        path="/admin/users"
                        element={<UserManagement />}
                    />
                    <Route
                        path="/admin/products"
                        element={<ProductManagement />}
                    />

                    {/* Fallback */}
                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />
                </Routes>
            </Router>
        </CartProvider>
    )
}

export default App
