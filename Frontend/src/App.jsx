import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Shop, Login, Signup, Profile, EditProfile, DeliveryAddress, Payment, OrderConfirmation } from "./pages"
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
