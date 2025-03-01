# Second Function

This project contains the second Cloud Function that is triggered by Firestore document changes, along with test scripts to measure latency between functions.

## Project Structure

```
.
├── protos/                     # Protocol Buffer definitions
│   ├── firestore.proto        # Main Firestore event definitions
│   └── google/                # Google common proto types
│       ├── protobuf/
│       │   ├── struct.proto   # Dynamic value definitions
│       │   └── timestamp.proto # Timestamp type
│       └── type/
│           └── latlng.proto   # LatLng type
├── src/
│   ├── config.js             # Firebase configuration
│   └── secondFunction.js     # Cloud Function implementation
└── test/
    └── test-functions.js     # Test script for measuring latency
```

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

## Testing

The test script measures latency between the first and second functions. To run the test:

1. Start both functions (first function in another terminal)
2. Run the test:
```bash
npm test
```

The test will:
1. Call the first function
2. Monitor Firestore for changes
3. Measure and display timing metrics:
   - First function duration
   - Trigger latency
   - Second function duration
   - Total end-to-end duration

## Proto Files

The project uses Protocol Buffers to decode Firestore event data. The proto files define:

- Document structure and fields
- Value types (string, number, boolean, etc.)
- Event data structure (old and new values)

These definitions match the Cloud Firestore event payload structure.
