# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

> ⚠️ **Network QR codes** – when you run `npx expo start` the CLI prints a
> QR code linking to your computer’s IP. Machines with multiple network
> adapters (VPNs, Docker, virtual NICs) sometimes expose a link‑local
> address (`169.254.x.x`) or a VM‑only address that isn’t reachable from your
> phone. The `scripts/start.js` helper scans all IPv4 interfaces, ignores
> link‑local addresses, and then prefers names containing **Wi‑Fi**,
> **Wireless**, or **Ethernet** (so physical network adapters are chosen
> ahead of VMware/VirtualBox/Tailscale, etc.). It sets
> `REACT_NATIVE_PACKAGER_HOSTNAME` accordingly. Always start the project via
> `npm start` (or `npm run android`/`npm run ios`) to ensure the correct URL
> ends up in the QR code.
>
2. Start the app

```bash
npm start        # or `npm run android` / `npm run ios` / `npm run web`
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
