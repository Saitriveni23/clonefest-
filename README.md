# 🔐 CipherDrop

Current version: 2.1.0

**CipherDrop** is a minimalist, zero-knowledge client-side encrypted online pastebin. Text content, code, attachments, sketches, and voice notes are encrypted and decrypted directly in the browser using 256-bit AES in Galois/Counter Mode (AES-256-GCM). The server never receives or has knowledge of the decryption keys or the plaintext payload.

---

## 🏗️ System Architecture

CipherDrop enforces absolute zero-knowledge confidentiality by keeping the cryptographic key in the **URL hash fragment (`#`)**. In accordance with RFC 3986, browsers do **not** transmit hash fragments to servers in HTTP request headers. Consequently, the encryption key remains strictly local in the recipient's browser.

### Data Split: What Goes Where?

| Data Layer | Location | Server Access | Technical Details |
|---|---|---|---|
| **Decryption Key (`#key`)** | Client Browser only | ❌ Never Sent | Stored in the browser URL hash fragment (`#`). |
| **Ciphertext Payload** | SQLite Database | 👁️ Encrypted Only | AES-256-GCM block of text, files, or drawings. |
| **Initialization Vector (IV)** | SQLite Database | 👁️ Visible | 12-byte random IV used to initialize the block cipher. |
| **Security Gates Metadata** | SQLite Database | 👁️ Visible | Expiration timestamp, SSS parameters, OTP configuration. |

### Cryptographic Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Sender Browser
    participant Server as Next.js Server & DB
    actor Recipient as Recipient Browser

    note over Creator: 1. Generate random AES-256-GCM key (K)<br/>2. Encrypt text/files with key (K) in browser
    Creator->>Server: POST /api/pastes (Ciphertext + IV only)
    Note right of Server: Save ciphertext block to database
    Server-->>Creator: Return Paste ID
    note over Creator: Construct Share URL: /p/{id}#K

    Note over Creator, Recipient: Creator sends Share URL to Recipient via secure channel

    Recipient->>Server: GET /api/pastes/{id}
    Server-->>Recipient: Return Ciphertext + IV block (refuses if expired or locked)
    note over Recipient: Extract key (K) from URL fragment (#)<br/>Decrypt ciphertext in browser with (K)
```

---

## 🛡️ Technical Security Model

### 1. Client-Side Cryptographic Engine
- **Cipher Algorithm**: AES-256-GCM (Galois/Counter Mode). Provides both confidentiality and integrity verification (authenticated encryption).
- **Key Derivation**: If a user password is set, keys are derived in-browser using **PBKDF2** (Password-Based Key Derivation Function 2) with SHA-256 hashing and 100,000 iterations, shielding the key from GPU-accelerated brute-force attacks.
- **Randomness**: IVs and salt buffers are generated using `window.crypto.getRandomValues()`, guaranteeing high-entropy cryptographic randomness.

### 2. Shamir's Secret Sharing (SSS) Vaults
- For threshold vaults, the master decryption key is split into $M$ parts using a polynomial over the Galois Field $GF(256)$. 
- Any $N$ parts ($N \le M$) can reconstruct the Lagrange interpolating polynomial to solve for the key. The server never holds the combined key parts.

---

## 🚦 Feature Roadmap: Implemented vs. Prototype Status

To protect project credibility, the table below documents which advanced features are fully implemented client-server protocols, and which ones are simulated prototypes for live demo presentations.

| Feature Area | Status | Execution Details |
|---|---|---|
| **Zero-Knowledge Encryption** | **FULLY FUNCTIONAL** | Encrypts and decrypts client-side using Web Crypto API. |
| **Plausible Deniability Decoy** | **FULLY FUNCTIONAL** | Generates double ciphertexts (real/decoy). Loads content depending on password entered. |
| **Duress Self-Destruct Switch** | **FULLY FUNCTIONAL** | Accessing the paste management panel with the Duress PIN instantly purges database records. |
| **Burn-After-Read Warning** | **FULLY FUNCTIONAL** | Shows 10s countdown, synthesizes alarm sweeps via browser Web Audio API, and melts text to random characters at 0s. |
| **Wrong Password Auto-Destruct** | **FULLY FUNCTIONAL** | Tracking incorrect decryption attempts server-side; deletes note if maximum attempts are exceeded. |
| **Whistleblower Dead Man Switch** | **FULLY FUNCTIONAL** | Refuses ciphertext delivery completely until the countdown timer expires. Keyholders can check-in to reset timer. |
| **Steganography Link Encoder** | **FULLY FUNCTIONAL** | Client-side Canvas API encodes the ciphertext URL inside image LSB pixels. |
| **E2E Polling Chat Room** | **FULLY FUNCTIONAL** | E2E encrypted client-to-client chat with server-side message polling endpoints. |
| **Shamir SSS Threshold Vault** | **FULLY FUNCTIONAL** | Polynomial key splitting and reconstruction executed entirely inside browser memory. |
| **Voice Notes & Sketchpad** | **FULLY FUNCTIONAL** | Records audio natively matching browser container (WebM/MP4), encrypting the raw binary. |
| **Geographic Region Fence** | **SIMULATED PROTOTYPE** | Logs country code parameters and displays access attempts. Mocks country mapping logs for live demo checks. |
| **Slack Command Simulator** | **SIMULATED PROTOTYPE** | Renders Slack bot webhook payload mock responses directly inside the command UI. |

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack, TypeScript)
- **Database**: SQLite / Redis memory fallback
- **UI & Animation**: Vanilla CSS, Tailwind CSS v4, Lucide React, Canvas Confetti
- **Audio Synthesis**: Web Audio API `AudioContext` oscillator sweep
- **PII Scanner**: Regex-based local scan for SSNs, phone numbers, emails, credit cards, and API keys.

---

## 🚀 Setup & Run Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Run Automated System Integration Tests
Execute the custom innovation scripts to test SSS threshold splits, decoy decryption, and dead man switch check-ins:
```bash
node .system_generated/tasks/test-innovations.js
```
