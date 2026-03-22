# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Backend API (Flask)

The app talks to the repo’s Flask backend over HTTP.

1. Copy `Mobile-app/.env.example` to `Mobile-app/.env`.
2. Set `EXPO_PUBLIC_API_BASE_URL` to your backend origin **with no trailing slash**:
   - iOS Simulator: `http://127.0.0.1:5000`
   - Android emulator: `http://10.0.2.2:5000`
   - Physical device: `http://<your-computer-LAN-IP>:5000` (same Wi‑Fi as the phone)
3. Run the backend (`python app.py` from `backend/`) and ensure `JWT_SECRET_KEY` is set in `backend/.env` so login works.
4. Restart Expo after changing `.env`.

Client code lives under `Mobile-app/lib/api/` (Axios instance + `auth` / `products` modules). Session token is stored with AsyncStorage; see `Mobile-app/context/AuthContext.tsx`.

### Checkout & PayPal

1. **Profile**: Delivery fields (name, address, city, ZIP) must be filled on the user account used at checkout.
2. **Cart → Proceed to Checkout** creates an invoice and line items on the backend, then opens **PayPal Payment**.
3. **Pay** calls `POST /payments/paypal/create-order`, then either:
   - **Sandbox / live**: opens the PayPal approval page via `expo-web-browser` and returns to the app using the `groceryapp` URL scheme (`Linking.createURL("/paypal-payment")` must match the backend `return_url` / `cancel_url`).
   - **Backend mock** (`PAYPAL_MOCK_MODE`): skips the browser and captures immediately (fake `approve_url` is not a real page).

After a successful capture, the cart is cleared when you return to the Home tab.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
