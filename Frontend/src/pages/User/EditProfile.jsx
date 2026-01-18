import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navbar from "../../components/Navbar"
import {
    ProfileHeader,
    ProfileAvatar,
    FormInput,
    PasswordInput,
    TabNavigation,
    LoadingButton
} from "../../components/UserProfile"

const EditProfile = () => {
    const navigate = useNavigate()

    // Mock current user data - replace with actual auth context
    const currentUser = {
        fullName: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        address: "123 Oak Street, Apt 4B",
        city: "New York",
        state: "NY",
        zipCode: "10001"
    }

    const [formData, setFormData] = useState(currentUser)
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [activeSection, setActiveSection] = useState("profile")

    const tabs = [
        { id: "profile", label: "Profile Information" },
        { id: "password", label: "Change Password" }
    ]

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: ""
            }))
        }
    }

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordData((prev) => ({
            ...prev,
            [name]: value
        }))
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: ""
            }))
        }
    }

    const validateProfile = () => {
        const newErrors = {}

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required"
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = "Name must be at least 2 characters"
        }

        if (!formData.email) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email"
        }

        if (!formData.phone) {
            newErrors.phone = "Phone number is required"
        } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
            newErrors.phone = "Please enter a valid phone number"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const validatePassword = () => {
        const newErrors = {}

        if (!passwordData.currentPassword) {
            newErrors.currentPassword = "Current password is required"
        }

        if (!passwordData.newPassword) {
            newErrors.newPassword = "New password is required"
        } else if (passwordData.newPassword.length < 8) {
            newErrors.newPassword = "Password must be at least 8 characters"
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
            newErrors.newPassword = "Password must contain uppercase, lowercase, and number"
        }

        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your new password"
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleProfileSubmit = async (e) => {
        e.preventDefault()

        if (validateProfile()) {
            setIsLoading(true)
            // Simulate API call
            setTimeout(() => {
                console.log("Profile updated:", formData)
                setIsLoading(false)
                navigate("/profile")
            }, 1500)
        }
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()

        if (validatePassword()) {
            setIsLoading(true)
            // Simulate API call
            setTimeout(() => {
                console.log("Password changed")
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                })
                setIsLoading(false)
                setActiveSection("profile")
            }, 1500)
        }
    }

    const handleChangePhoto = () => {
        console.log("Change photo clicked")
        // Implement photo upload logic
    }

    return (
        <div className="min-h-screen bg-premium-background">
            <Navbar cartCount={0} />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProfileHeader
                    title="Edit Profile"
                    subtitle="Update your personal information and settings"
                    backLink="/profile"
                />

                <div className="bg-white rounded-[--radius-card] shadow-lg overflow-hidden">
                    <TabNavigation
                        tabs={tabs}
                        activeTab={activeSection}
                        onChange={setActiveSection}
                    />

                    {/* Profile Information Section */}
                    {activeSection === "profile" && (
                        <form
                            onSubmit={handleProfileSubmit}
                            className="p-8">
                            <ProfileAvatar
                                name={formData.fullName}
                                editable
                                onChangePhoto={handleChangePhoto}
                            />

                            <div className="space-y-5">
                                <FormInput
                                    label="Full Name"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    error={errors.fullName}
                                    placeholder="John Doe"
                                    required
                                />

                                <FormInput
                                    label="Email Address"
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={errors.email}
                                    placeholder="you@example.com"
                                    required
                                />

                                <FormInput
                                    label="Phone Number"
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    error={errors.phone}
                                    placeholder="+1 (555) 123-4567"
                                    required
                                />

                                <FormInput
                                    label="Street Address"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="123 Main Street, Apt 4B"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormInput
                                        label="City"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="New York"
                                    />
                                    <FormInput
                                        label="State"
                                        id="state"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="NY"
                                    />
                                    <FormInput
                                        label="Zip Code"
                                        id="zipCode"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        placeholder="10001"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <LoadingButton loading={isLoading}>Save Changes</LoadingButton>
                                <Link
                                    to="/profile"
                                    className="flex-1 bg-white border-2 border-gray-300 hover:border-premium-secondary text-premium-text font-bold py-3 rounded-[--radius-button] text-center transition-all duration-200">
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Change Password Section */}
                    {activeSection === "password" && (
                        <form
                            onSubmit={handlePasswordSubmit}
                            className="p-8">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-premium-text mb-2">Change Your Password</h3>
                                <p className="text-sm text-gray-600">
                                    Ensure your account is using a strong password to stay secure
                                </p>
                            </div>

                            <div className="space-y-5">
                                <PasswordInput
                                    label="Current Password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    error={errors.currentPassword}
                                    placeholder="Enter current password"
                                />

                                <PasswordInput
                                    label="New Password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    error={errors.newPassword}
                                    placeholder="Enter new password"
                                    showStrength
                                />

                                <PasswordInput
                                    label="Confirm New Password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    error={errors.confirmPassword}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="flex gap-4 mt-8">
                                <LoadingButton loading={isLoading}>Change Password</LoadingButton>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPasswordData({
                                            currentPassword: "",
                                            newPassword: "",
                                            confirmPassword: ""
                                        })
                                        setErrors({})
                                    }}
                                    className="flex-1 bg-white border-2 border-gray-300 hover:border-premium-secondary text-premium-text font-bold py-3 rounded-[--radius-button] transition-all duration-200">
                                    Clear
                                </button>
                            </div>
                        </form>
                    )}
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

export default EditProfile
