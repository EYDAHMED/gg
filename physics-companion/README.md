# Physics - Daily Life Companion (PWA + Android APK)

Physics is a calm, bilingual (English LTR / Arabic RTL) AI companion for daily scheduling, focus timers, automatic prayer times, hands-free offline voice wake ("Hey Physics"), spoken TTS answers, and Android phone control.

## Run Locally
    cd physics-companion
    npm install --legacy-peer-deps
    cp .env.example .env
    npm run dev

## GitHub Actions APK Build
Add your Gemini key (AQ... or AIza...) in GitHub Settings -> Secrets and variables -> Actions as VITE_AI_API_KEY, then push to main to download physics-companion-apk from Actions -> Artifacts.