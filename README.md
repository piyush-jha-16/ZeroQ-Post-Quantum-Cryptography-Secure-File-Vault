# ZeroQ: Post Quantum Cryptography Secured File Vault

ZeroQ Vault is a post-quantum secure file sharing application built around browser-side encryption, sender authentication, and encrypted private-key recovery. The server stores only encrypted payloads, public keys, and metadata needed to deliver files between authenticated users.

## Overview

The application is designed to keep plaintext file content and private keys out of the backend. Users generate post-quantum key pairs in the browser, register public keys with the server, and keep private keys locally. File sharing follows a sender-encrypts, recipient-decrypts model using NIST-standardized algorithms.

## Tech Stack

### Backend
- Python 3
- FastAPI
- SQLAlchemy
- PostgreSQL
- Uvicorn
- JWT authentication with python-jose
- Argon2 password hashing via passlib
- python-dotenv for configuration
- cryptography for cryptographic support

### Frontend
- React 18
- Vite
- React Router
- Axios
- Tailwind CSS
- @oqs/liboqs-js for post-quantum cryptography in the browser

### Infrastructure
- Docker
- Docker Compose

## Key Capabilities

- Browser-side generation of ML-KEM-768 and ML-DSA-65 key pairs
- Browser-side file encryption with AES-256-GCM
- Sender authentication using ML-DSA signatures
- Recipient-side signature verification before decryption
- Encrypted private-key backup protected by a recovery secret
- Protected application routes with JWT-based session handling
- PostgreSQL-backed persistence for users, file records, and encrypted key backups

## Cryptography

### Key Encapsulation
- Algorithm: ML-KEM-768
- Purpose: Establish a shared secret between sender and recipient
- Output: A shared secret used as the AES-256 key

### File Encryption
- Algorithm: AES-256-GCM
- Purpose: Encrypt the file contents in the browser before upload
- Nonce: Random 12-byte IV generated per file
- Integrity: GCM authentication tag included with the ciphertext

### Signatures
- Algorithm: ML-DSA-65
- Purpose: Sign encrypted file payloads and verify sender authenticity
- Verification: Required on the recipient side before decryption

### Key Recovery
- Private keys are stored locally in the browser for normal operation
- An encrypted backup of the private keys is stored on the server
- The backup is protected with a user-defined recovery secret and decrypted only in the browser

## Application Flow

```mermaid
flowchart LR
    A[Register in browser] --> B[Generate ML-KEM and ML-DSA key pairs]
    B --> C[Store private keys locally]
    B --> D[Send public keys and encrypted key backup to server]
    E[Upload file] --> F[Fetch recipient public key]
    F --> G[Encapsulate shared secret with ML-KEM]
    G --> H[Encrypt file with AES-256-GCM]
    H --> I[Sign encrypted payload with ML-DSA]
    I --> J[Upload encrypted file and metadata]
    K[Recipient opens inbox] --> L[Download encrypted payload]
    L --> M[Verify signature with sender public key]
    M --> N[Decapsulate shared secret with local private key]
    N --> O[Decrypt file in browser]
    O --> P[Save decrypted file locally]
```

## User Experience

- Register: Create an account, generate post-quantum key pairs, and set a recovery secret.
- Login: Authenticate with username and password.
- Dashboard: Review the security model and navigate to send, inbox, or recovery actions.
- Upload: Encrypt a file for another user and send it to the vault.
- Inbox: View incoming files, verify signatures, and decrypt downloads.
- Recover Keys: Restore local private keys from the encrypted server-side backup.

## Data Model

### Users
- UUID primary key
- Unique username
- Argon2 password hash
- Base64-encoded ML-KEM public key
- Base64-encoded ML-DSA public key
- Creation timestamp

### File Records
- UUID primary key
- Sender and receiver user references
- Raw encrypted file bytes
- Base64-encoded ML-KEM ciphertext
- Base64-encoded AES nonce
- Base64-encoded ML-DSA signature
- Original file name
- Creation timestamp

### Key Backups
- One encrypted key backup per user
- Base64-encoded encrypted private-key payload
- Base64-encoded PBKDF2 salt
- Base64-encoded AES-GCM nonce
- Created and updated timestamps

## API Surface

### Authentication
- POST /auth/register - Register a user with public keys and encrypted key backup
- POST /auth/login - Authenticate and receive a JWT access token
- GET /auth/key-backup - Fetch the authenticated user's encrypted private-key backup

### Vault
- GET /users/{username}/keys - Fetch a user's public keys
- POST /vault/upload - Upload an encrypted file and its metadata
- GET /vault/inbox - List files received by the authenticated user
- GET /vault/download/{file_id} - Retrieve an encrypted file for decryption in the browser

### Health
- GET / - Basic API root response

## Project Structure

```text
pqc-vault/
  docker-compose.yml
  README.md
  backend/
    Dockerfile
    requirements.txt
    app/
      main.py
      config.py
      database.py
      models.py
      schemas.py
      auth.py
      routers/
        auth_router.py
        vault_router.py
  frontend/
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    index.html
    src/
      App.jsx
      api.js
      crypto.js
      index.css
      main.jsx
      pages/
        Register.jsx
        Login.jsx
        Dashboard.jsx
        Upload.jsx
        Inbox.jsx
        RecoverKeys.jsx
```

## Requirements

- Docker and Docker Compose for the full stack
- Node.js 18 or later for frontend development
- Python 3.11 or later for backend development
- A modern browser with Web Crypto support
- Internet access on first run for frontend dependency installation

## Configuration

Create a local environment file at the project root and provide the following values:

- POSTGRES_USER
- POSTGRES_PASSWORD
- JWT_SECRET
- DATABASE_URL for local backend development outside Docker

The Docker Compose setup injects the database URL and JWT configuration for the containerized backend automatically.

## How to Run This Project

### Prerequisites

Ensure you have one of the following installed:
- **For Docker setup:** Docker and Docker Compose
- **For local development:** Python 3.11+, Node.js 18+, and PostgreSQL

### Option 1: Run with Docker (Recommended)

#### Step 1: Clone and Navigate
```bash
cd ZeroQ-Post-Quantum-Cryptography-Secure-File-Vault
```

#### Step 2: Create Environment File
Create a `.env` file in the project root:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_secret_key_min_32_chars_long
```

#### Step 3: Start the Stack
```bash
docker-compose up -d
```

This command will:
- Build and start the PostgreSQL database
- Build and start the FastAPI backend (http://localhost:8000)
- Build and start the React frontend (http://localhost:5173)

#### Step 4: Access the Application
- **Frontend:** Open http://localhost:5173 in your browser
- **API Docs:** http://localhost:8000/docs

#### Step 5: Stop the Stack
```bash
docker-compose down
```

**Note:** The first backend build may take longer due to post-quantum cryptography compilation. Subsequent builds will be faster.

### Option 2: Local Development

#### Backend Setup

##### Step 1: Navigate to Backend Directory
```bash
cd backend
```

##### Step 2: Create Virtual Environment
```bash
python -m venv venv
```

##### Step 3: Activate Virtual Environment
**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

##### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

##### Step 5: Set Environment Variables
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://postgres:password@localhost/pqc_vault
JWT_SECRET=your_secret_key_min_32_chars_long
DEBUG=True
```

Or set them in your terminal:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL = "postgresql://postgres:password@localhost/pqc_vault"
$env:JWT_SECRET = "your_secret_key"
```

**macOS/Linux (Bash):**
```bash
export DATABASE_URL="postgresql://postgres:password@localhost/pqc_vault"
export JWT_SECRET="your_secret_key"
```

##### Step 6: Start Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at http://localhost:8000

#### Frontend Setup

##### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

##### Step 2: Install Dependencies
```bash
npm install
```

##### Step 3: Start Development Server
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

#### Step 4: Verify Connection
Ensure the backend is running before starting the frontend. The frontend expects the API at http://localhost:8000.

### Database Setup (for Local Development)

If running locally without Docker, you need PostgreSQL:

**Using Docker for just the database:**
```bash
docker run --name pqc-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=pqc_vault -p 5432:5432 -d postgres:15
```

**Using local PostgreSQL:**
```bash
createdb pqc_vault
```

### Verify Installation

Once running, test the setup:
1. Navigate to http://localhost:5173
2. Click on "Register" to create an account
3. The page should generate post-quantum key pairs in your browser
4. After registering, you can login and test the upload/inbox features

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker build fails | Ensure Docker daemon is running and you have sufficient disk space |
| Backend won't start | Check that PORT 8000 is not in use; verify DATABASE_URL is correct |
| Frontend won't load | Ensure the backend is running at http://localhost:8000; check browser console for errors |
| Database connection error | Verify PostgreSQL is running and credentials in .env match |
| Port already in use | Modify port numbers in docker-compose.yml or use `lsof` (Unix) / `netstat` (Windows) to find conflicting processes |

## Security Notes

- Private keys are stored in browser local storage for normal operation.
- The app warns users that clearing browser storage can make previously stored files unrecoverable.
- The server never receives plaintext files or private keys.
- Signature verification happens before decryption on the recipient side.
- File decryption only occurs in the browser.
- Recovery is only possible with the correct recovery secret and the stored encrypted backup.

## Operational Notes

- Usernames must be unique.
- Files are addressed to a specific recipient username.
- Inbox listings show sender, original file name, and creation timestamp.
- The backend waits for the database to become available during startup.
- CORS is configured for the local frontend origin http://localhost:5173.

## Troubleshooting

- If the backend fails to start, verify the database container is running and the environment variables are set.
- If the frontend cannot load the post-quantum library, confirm that the browser has network access and that dependencies installed successfully.
- If recovery fails, confirm the recovery secret matches the one used during registration.
- If downloads fail signature verification, the payload may have been altered or the wrong sender key may be in use.

## License

Educational and research use only.

## References

- NIST FIPS 203: ML-KEM
- NIST FIPS 204: ML-DSA
- liboqs: https://github.com/open-quantum-safe/liboqs
- liboqs-wasm: https://github.com/open-quantum-safe/liboqs-wasm
