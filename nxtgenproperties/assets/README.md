# Assets

Before your first build, place the following image files here. Paths in `app.json` already point at these names.

| File                  | Size (px)    | Notes                                                 |
| --------------------- | ------------ | ----------------------------------------------------- |
| `icon.png`            | 1024 × 1024  | Square, no transparency, no rounded corners (iOS clips it). |
| `adaptive-icon.png`   | 1024 × 1024  | Android foreground. Keep the logo in the centre 66%.   |
| `splash.png`          | 1284 × 2778  | Centered logo on `#FF6B35` background. `contain` resize. |
| `notification-icon.png` | 96 × 96    | Android only. Silhouette on transparent bg.            |
| `favicon.png`         | 48 × 48      | Optional — web build.                                 |

If you have a single high-resolution logo, run `npx expo-optimize` or use the
Expo dashboard's Icon Generator to produce all the sizes from one source file.

The bundled Expo CLI won't start without `icon.png` and `splash.png` present
when the paths are referenced in `app.json`.
