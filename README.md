# Secure Password Toolkit 🛡️✨

> **Live Demo:** [https://password-tk-cg.web.app](https://password-tk-cg.web.app)

A comprehensive, AI-powered toolkit for generating, analyzing, and managing secure passwords and passphrases. Built with React, TypeScript, and the Google Gemini API, this application provides a suite of advanced features to enhance your digital security in a modern, user-friendly interface.

*A screenshot of the application would go here.*

---

## ✨ Key Features

-   🔑 **Advanced Password Generation**: Create strong, random passwords with granular control over length, character sets (uppercase, lowercase, numbers, symbols), and minimum character requirements.

-   📜 **Memorable Passphrase Generation**: Generate secure passphrases using a curated wordlist. Customize the word count, separator character, capitalization, and inclusion of numbers.

-   🤖 **AI-Powered Creation**:
    -   **AI Passwords**: Let the Gemini AI generate a secure password that strictly adheres to your custom rules.
    -   **AI Passphrases**: Describe a theme (e.g., "deep sea creatures" or "cyberpunk future") and let AI generate a creative and relevant passphrase.

-   🔍 **AI Security Auditor**:
    -   Get an in-depth security analysis of any password.
    -   The AI auditor checks for vulnerabilities like brute-force risk, dictionary words, predictable patterns, and common substitutions.
    -   Receive an overall strength rating, a list of identified vulnerabilities, and actionable suggestions for improvement.
    -   Automatically generate a stronger, improved version of the audited password based on the AI's suggestions.

-   📦 **Bulk Generation & Export**:
    -   Generate large quantities (up to 50) of passwords or passphrases at once.
    -   Easily copy all results to the clipboard or export them to a `.txt` file.

-   📊 **Real-time Strength Analysis**: An intuitive strength meter provides instant feedback on the security of your password as you adjust settings or type in the auditor.

-   🕒 **Secure Local History**:
    -   Automatically saves your last 10 generated passwords/passphrases to your browser's local storage.
    -   View, copy, delete, or re-use previous passwords.
    -   Intuitive swipe gestures: swipe left to delete, swipe right to copy.
    -   Export your history to a text file.

-   🎨 **Modern & Responsive UI**:
    -   A sleek, dark-themed interface with a dynamic animated background.
    -   Fully responsive design for a seamless experience on both desktop and mobile devices.
    -   Helpful tooltips and keyboard shortcuts for power users.

-   ⌨️ **Keyboard Shortcuts**:
    -   `Ctrl/Cmd + G`: Generate a new password/passphrase.
    -   `Ctrl/Cmd + C`: Copy the current password.
    -   `Ctrl/Cmd + 1-4`: Switch between Password, Passphrase, Audit, and Bulk tabs.

---

## 🚀 How to Use

### 1. Generating a Password or Passphrase
1.  Select the **Password** or **Passphrase** tab.
2.  Adjust the options to your liking:
    -   For **Passwords**: Use the slider to set the length and toggle the checkboxes for character types. You can also specify the minimum number of each character type.
    -   For **Passphrases**: Use the slider for word count and customize the separator, capitalization, and number inclusion.
3.  Click the main **Generate** button (or press `Ctrl/Cmd + G`).
4.  Your new secure password/passphrase will appear at the top. Click the copy icon to copy it to your clipboard.

### 2. Using the AI Generator
1.  Navigate to the **Password** or **Passphrase** tab.
2.  In the "Generate with AI" section:
    -   If generating a **password**, simply click the "Generate with AI" button. The AI will use your currently selected options as rules.
    -   If generating a **passphrase**, type a theme into the input box (e.g., "ancient Egypt") and click the generate button.
3.  The AI will generate a result that appears at the top.

### 3. Auditing a Password
1.  Go to the **Audit** tab.
2.  Type or paste the password you want to analyze into the input field.
3.  Click the **Audit Password** button.
4.  The AI will perform a security analysis and display the results, including a rating, vulnerabilities, and suggestions.
5.  If you want an improved version, click the **Generate with Suggestions** button to have the AI create a stronger password of the same length.

### 4. Bulk Generation
1.  Switch to the **Bulk** tab.
2.  Choose whether you want to generate Passwords or Passphrases.
3.  Use the slider to set the desired quantity.
4.  Configure the generation options below, just as you would in the single-generation tabs.
5.  Click **Generate Bulk**.
6.  The generated list will appear. You can copy individual items, copy the entire list, or export it as a `.txt` file.

---

## 🛠️ Technology Stack

-   **Frontend:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
-   **AI & Language Model:** [Google Gemini API](https://ai.google.dev/gemini-api) (`@google/genai`)

---

## 🔒 Security & Privacy

Your privacy is paramount. This application is designed with a client-first approach:

-   **No Server-Side Storage:** All generated passwords and history are stored exclusively in your browser's `localStorage`. This data never leaves your computer.
-   **Direct API Communication:** When using AI features, your browser communicates directly and securely with the Google Gemini API. No intermediary servers are involved.
-   **Ephemeral Data:** Clearing your browser's cache or local storage will permanently remove your password history.
