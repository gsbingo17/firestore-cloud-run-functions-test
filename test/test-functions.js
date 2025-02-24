const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Initialize Firebase Admin
const app = admin.initializeApp({
  // In production, credentials will be loaded from GOOGLE_APPLICATION_CREDENTIALS
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function testFunctions(firstFunctionUrl) {
  try {
    console.log('Starting test...');
    const requestId = Date.now().toString();
    
    // Make request to first function
    // Ensure we're using the correct endpoint
    const url = firstFunctionUrl.endsWith('/') ? `${firstFunctionUrl}modifyDocument` : `${firstFunctionUrl}/modifyDocument`;
    console.log(`Making request to first function with requestId: ${requestId}`);
    console.log(`URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`First function failed: ${response.statusText}\n${errorText}`);
    }

    console.log('First function called successfully');
    
    // Wait for and monitor the timing document
    console.log('Monitoring timing collection for results...');
    const timingDoc = db.collection('timing').doc(requestId);
    
    // Wait for the complete timing data
    await new Promise((resolve, reject) => {
      const unsubscribe = timingDoc.onSnapshot((doc) => {
        const data = doc.data();
        if (!data) return;

        console.log('\nCurrent timing data:');
        console.log('First Function Start:', new Date(data.firstFunctionStart).toISOString());
        
        if (data.firstFunctionEnd) {
          console.log('First Function End:', new Date(data.firstFunctionEnd).toISOString());
          console.log('First Function Duration:', data.firstFunctionEnd - data.firstFunctionStart, 'ms');
        }
        
        if (data.secondFunctionStart) {
          console.log('Second Function Start:', new Date(data.secondFunctionStart).toISOString());
          console.log('Trigger Latency:', data.secondFunctionStart - data.firstFunctionEnd, 'ms');
        }
        
        if (data.secondFunctionEnd) {
          console.log('Second Function End:', new Date(data.secondFunctionEnd).toISOString());
          console.log('Second Function Duration:', data.secondFunctionEnd - data.secondFunctionStart, 'ms');
          console.log('Total Duration:', data.totalDuration, 'ms');
          
          if (data.triggerDetails) {
            console.log('\nTrigger Details:');
            console.log('Event Type:', data.triggerDetails.eventType);
            console.log('Event Time:', data.triggerDetails.eventTime);
            console.log('Document Path:', data.triggerDetails.documentPath);
          }
          
          // Complete test when we have all the data
          unsubscribe();
          resolve();
        }
      }, reject);

      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Test timed out waiting for complete timing data'));
      }, 30000);
    });

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1); // Exit with error code
  } finally {
    // Cleanup
    await app.delete();
  }
}

// Get the first function URL from command line argument
const firstFunctionUrl = process.argv[2];
if (!firstFunctionUrl) {
  console.error('Please provide the first function URL as an argument');
  console.error('Usage: node test-functions.js http://localhost:8080');
  process.exit(1);
}

testFunctions(firstFunctionUrl);
