# First Function

This project contains the first Cloud Function that triggers Firestore document changes.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase credentials:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## Running Locally

Start the function:
```bash
npm start
```

This will start the function on http://localhost:8080

## Endpoints

- `POST /modifyDocument`
  - Creates/updates a document in Firestore
  - Headers:
    - `x-request-id`: Optional request ID (defaults to timestamp)
  - Response: JSON with success status and request ID
