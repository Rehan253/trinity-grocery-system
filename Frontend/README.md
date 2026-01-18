# FreshExpress - Premium Online Grocery Store 🛒

A modern, responsive e-commerce frontend for an online grocery store built with React, Vite, and Tailwind CSS.

## 🎨 Design System

### Premium Color Palette

-   **Primary**: `#FF6B35` (Orange) - CTA buttons, prices, accents
-   **Secondary**: `#004E89` (Navy) - Headers, text, navigation
-   **Background**: `#F4F7F6` (Off-white) - Page background
-   **Text**: `#1A1A1A` (Dark) - Body text
-   **Accent**: `#D81159` (Ruby Red) - Special offers, badges

### Typography

-   **Font Families**: Inter & Poppins (via Google Fonts)
-   **Brand Name**: Poppins Bold
-   **Body Text**: Inter

### Border Radius

-   **Cards**: 12px (`--radius-card`)
-   **Buttons**: 30px (`--radius-button`) - Pill shape

## 🏗️ Project Structure

```
Frontend/
├── src/
│   ├── components/                  # Reusable component modules
│   │   ├── Navbar/                  # Main navigation
│   │   │   ├── Navbar.jsx
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   ├── Products/                # Product components module
│   │   │   ├── ProductCard.jsx      # Product display card
│   │   │   ├── ProductGrid.jsx      # Product grid layout
│   │   │   ├── CategorySidebar.jsx  # Category navigation
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   └── UserProfile/             # User profile components
│   │       ├── ProfileHeader.jsx    # Page headers
│   │       ├── ProfileAvatar.jsx    # User avatars
│   │       ├── FormInput.jsx        # Form inputs
│   │       ├── PasswordInput.jsx    # Password fields
│   │       ├── TabNavigation.jsx    # Tab interface
│   │       ├── LoadingButton.jsx    # Loading buttons
│   │       ├── index.js
│   │       └── README.md
│   ├── pages/                       # Page modules
│   │   ├── Products/                # Products/Shopping module
│   │   │   ├── Shop.jsx             # Main shop/browse page
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   ├── Auth/                    # Authentication module
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Signup.jsx           # Registration
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   ├── User/                    # User profile module
│   │   │   ├── Profile.jsx          # User profile & orders
│   │   │   ├── EditProfile.jsx      # Edit profile
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   ├── index.js
│   │   └── README.md
│   ├── data/                        # Mock data
│   │   ├── products.js              # Product catalog
│   │   └── orders.js                # Order history
│   ├── App.jsx                      # Router config
│   ├── index.css                    # Tailwind config
│   └── main.jsx                     # Entry point
├── COMPONENTS_STRUCTURE.md          # Component architecture docs
├── AUTH_GUIDE.md                    # Authentication guide
├── index.html
├── package.json
├── postcss.config.js
└── vite.config.js
```

> **See [COMPONENTS_STRUCTURE.md](COMPONENTS_STRUCTURE.md) for detailed component architecture**

## 🚀 Features

### ✅ Authentication & User Pages

-   **Login Page** (`/login`):
    -   Email and password authentication
    -   Password visibility toggle
    -   "Remember me" option
    -   Forgot password link
    -   Social login (Google, Facebook)
    -   Client-side validation
    -   Loading states
-   **Signup Page** (`/signup`):
    -   Complete registration form
    -   Password strength validation
    -   Confirm password matching
    -   Phone number validation
    -   Terms and conditions checkbox
    -   Social signup options
    -   Membership benefits display
    -   Comprehensive form validation
-   **Profile Page** (`/profile`):
    -   User information sidebar with stats
    -   Complete order history with expandable details
    -   Order status tracking (Delivered, Shipped, Processing, Cancelled)
    -   Order management actions (Reorder, Track, Cancel, Review)
    -   Tab navigation (Orders, Addresses, Payments)
    -   Responsive design with sticky sidebar
    -   6 sample orders with various statuses
-   **Edit Profile Page** (`/edit-profile`):
    -   Two-section tab interface (Profile Info & Change Password)
    -   Update personal information (name, email, phone, address)
    -   Profile picture placeholder with upload option
    -   Change password with validation
    -   Password visibility toggles
    -   Form validation with real-time error feedback
    -   Save/Cancel actions with loading states

### ✅ Navbar Component

-   Sticky navigation with search bar
-   Shopping cart with notification badge
-   Horizontal category navigation
-   Fully responsive with mobile menu
-   Search functionality

### ✅ Two-Column Layout

-   **Left Sidebar (20% width)**:
    -   Vertical category list with icons
    -   Product counts per category
    -   Active state highlighting
    -   Promotional section
    -   Sticky positioning
-   **Right Content (80% width)**:
    -   Responsive product grid (1-4 columns)
    -   Product filtering by category
    -   Sort functionality
    -   Empty state handling

### ✅ Product Cards

-   Light grey image containers
-   Product name in Navy (bold)
-   Price in Orange
-   Circular '+' add to cart button
-   Discount badges
-   Low stock indicators
-   Rating and reviews
-   Hover effects and animations

## 📦 Installation

```bash
cd Frontend
npm install
```

## 🎯 Running the Application

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🛠️ Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run preview` - Preview production build
-   `npm run lint` - Run ESLint

## 🛣️ Routes

-   `/` - Home page (product catalog)
-   `/login` - User login
-   `/signup` - User registration
-   `/profile` - User profile & order history
-   `/edit-profile` - Edit user profile & change password
-   `*` - Redirects to home

## 📱 Responsive Breakpoints

-   **Mobile**: < 768px (single column, stacked layout)
-   **Tablet**: 768px - 1024px (2 columns for products)
-   **Desktop**: > 1024px (sidebar + 3-4 column grid)

## 🎨 Custom Tailwind Classes

Use these throughout your components:

### Colors

```jsx
// Backgrounds
className = "bg-premium-primary" // Orange
className = "bg-premium-secondary" // Navy
className = "bg-premium-background" // Off-white
className = "bg-premium-accent" // Ruby Red

// Text
className = "text-premium-primary"
className = "text-premium-secondary"
className = "text-premium-text"
```

### Border Radius

```jsx
className = "rounded-[--radius-card]" // 12px for cards
className = "rounded-[--radius-button]" // 30px for buttons
```

### Animations

```jsx
className = "animate-spin-slow" // Slow spinning animation
className = "animate-fadeIn" // Fade in animation
```

## 📊 Sample Data

The application includes 26 sample products across 8 categories:

-   Fruits (4 products)
-   Vegetables (4 products)
-   Dairy (4 products)
-   Bakery (3 products)
-   Meat (3 products)
-   Seafood (2 products)
-   Beverages (3 products)
-   Snacks (3 products)

## 🔄 State Management

Currently using React useState. For production, consider:

-   Context API for global cart state
-   Zustand (already installed)
-   Redux Toolkit

## 🌐 API Integration

Product data is currently static. To integrate with backend:

1. Replace `sampleProducts` import with API call
2. Add loading states
3. Implement error handling
4. Add product search/filter endpoints

## 🎯 Future Enhancements

-   [ ] Shopping cart page
-   [ ] Product detail modal/page
-   [ ] User authentication
-   [ ] Checkout process
-   [ ] Order history
-   [ ] Product search with filters
-   [ ] Wishlist functionality
-   [ ] Product reviews and ratings
-   [ ] Real-time inventory updates

## 📝 Component Usage Examples

### Adding a Product Card

```jsx
import ProductCard from "./components/ProductCard"

const product = {
    id: 1,
    name: "Fresh Apples",
    category: "Fruits",
    price: 4.99,
    icon: "🍎"
}

<ProductCard product={product} onAddToCart={(p) => console.log(p)} />
```

### Using the Category Sidebar

```jsx
import CategorySidebar from "./components/CategorySidebar"
;<CategorySidebar onCategorySelect={(cat) => setSelectedCategory(cat)} />
```

### Implementing the Navbar

```jsx
import Navbar from "./components/Navbar"
;<Navbar cartCount={3} />
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test responsiveness
4. Submit a pull request

## 📄 License

This project is part of the Trinity Grocery System.

---

Built with ❤️ using React, Vite, and Tailwind CSS
