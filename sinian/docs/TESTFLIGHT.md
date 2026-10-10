# Kinsong → TestFlight

The app is named **Kinsong** (as in "a song of kin"). When this was written, no App Store listing used that name. App Store Connect gives you the final answer when you create the app record, so run a trademark search (USPTO and CIPO) before going public.

| Field | Value |
| --- | --- |
| App Store name (≤30) | `Kinsong: Family Voices` |
| Subtitle (≤30) | `Their words, kept close` |
| Home-screen name | `Kinsong` |
| Bundle ID | `app.kinsong.ios`. Change it in `app/app.json` if you'd rather use your own domain (e.g. `com.yourcompany.kinsong`) |
| Primary category | Lifestyle. Avoid Health & Fitness / Medical, because this is not a therapy product |
| Age rating | Choose the highest (adult) rating. The app requires 18+ at consent |

## What you need

1. A paid **Apple Developer Program** membership, with an Account Holder or Admin role.
2. A free **Expo account**. EAS Build compiles the iOS app on Expo's Macs, so you don't need Xcode.
3. A Mac is not required.

## One-time setup (about 15 minutes)

```sh
npm install -g eas-cli
cd sinian/app
eas login                       # your Expo account
eas init                        # creates the EAS project; writes extra.eas.projectId into app.json
```

**Create the app in App Store Connect:** My Apps → **+** → New App → iOS. Use the name `Kinsong: Family Voices` and pick the bundle ID `app.kinsong.ios`. If the bundle ID isn't in the list yet, run the build below first: EAS registers it and turns on the *Increased Memory Limit* capability. Copy the app's **Apple ID** (a number shown under App Information) into `eas.json` → `submit.testflight.ios.ascAppId`.

## Build and upload

```sh
cd sinian/app
npm run testflight
# = eas build --platform ios --profile testflight --auto-submit-with-profile testflight
```

The first run asks you to sign in with your Apple ID and offers to create the distribution certificate and provisioning profile. Say yes to both. For CI, create an App Store Connect API key (Users and Access → Integrations → Keys, "App Manager" role) and give it to EAS with `eas credentials`.

The build takes about 20–40 minutes, mostly compiling llama.cpp and whisper.cpp. EAS then uploads it to App Store Connect. Apple's processing adds another 5–30 minutes before the build shows up under **TestFlight**.

## Inviting testers

- **Internal testers** (up to 100 members of your App Store Connect team): TestFlight → Internal Testing → add a group. No Apple review is needed.
- **External testers** (up to 10,000, invited by email or public link): the first build needs **Beta App Review**. Paste the notes below.

### Beta App Review notes (paste into "What to Test" / review notes)

> Kinsong lets a family create a private, on-device AI conversation partner from the messages, voice recordings and photos a deceased loved one left behind. Nothing is uploaded: chat parsing, the language model, voice synthesis and speech recognition all run on the device.
>
> Safeguards: every required family member and the estate's executor must sign consent in the app before any data is read, and withdrawing consent deletes everything. The screen is permanently labelled "AI simulation", with a reminder at least every 3 hours. If a user expresses suicidal thoughts, the app leaves the simulation and shows 988 / Crisis Text Line / 911. The app is for adults only and makes no medical or therapeutic claims.
>
> To test without real data: on Family consent, add yourself as "Child" and mark yourself executor; upload any file as the death certificate and letters; verify, sign, and confirm the list. Then in Memories, import the bundled sample `app/sample-data/sample-chat.csv` (a fictional grandmother; send it to reviewers, or AirDrop it to the device). Models are downloaded in Settings from URLs we provide to reviewers.

### App Privacy ("nutrition label")

Choose **Data Not Collected**. This holds only while there are no analytics, crash reporting or servers. Revisit it before adding any.

## Known gaps before external testing

- **Model downloads:** testers need direct URLs for the GGUF/ggml files (see ARCHITECTURE.md → recommended models). Host them somewhere you control, or prefill the URLs in `src/native/models.ts`.
- **Real device only:** llama.rn and whisper.rn won't run in the iOS Simulator at useful speed. Test on an iPhone 15 Pro or newer (8 GB RAM) for the 3–4B model.
- **Not yet run on hardware:** this build has passed TypeScript checks and an iOS `expo prebuild`, but has never been compiled or launched. Expect a first round of native fixes after the first EAS build.
- **Icon:** `assets/icon.png` is a placeholder. Replace it with a designed icon (1024×1024, no transparency) before public release.
