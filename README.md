# Secure Password Toolkit

**Live Demo → [password-tk-cg.web.app](https://password-tk-cg.web.app)**

A password generator I built because every online tool I used either looked terrible, showed ads, or sent data somewhere I didn't trust. This one runs entirely in your browser — nothing leaves your machine.

---

## What it does

- **Password generator** — pick your length, toggle character sets, set minimums per type
- **Passphrase generator** — word count, separator, capitalize, add a number
- **AI generation** — uses Gemini to generate a password or themed passphrase that strictly matches your settings
- **AI security audit** — paste any password and get a breakdown of its weaknesses + suggestions to fix them. Can also auto-generate an improved version
- **Bulk generation** — generate up to 50 passwords or passphrases at once, copy all or export as `.txt`
- **Local history** — your last 10 generated passwords are saved in `localStorage`. Swipe left to delete, swipe right to copy

---

## AI features

The AI tools use the **Google Gemini API** (you provide your own key). Get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey), paste it into the ⚙ settings panel in the app, and it's stored locally — never sent anywhere else.

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + G` | Generate new password |
| `Ctrl/Cmd + C` | Copy current password |
| `Ctrl/Cmd + 1–4` | Switch tabs |

---

## Stack

- React + TypeScript
- Tailwind CSS
- Google Gemini API (`@google/genai`)
- Firebase Hosting

---

## Running locally

```bash
git clone https://github.com/chetangoswami/Secure-Password-Toolkit.git
cd Secure-Password-Toolkit
npm install
npm run dev
```

---

## Privacy

Everything stays on your device. Passwords and history are stored in `localStorage`. When you use AI features, your browser talks directly to the Gemini API — there's no backend, no database, no tracking.
