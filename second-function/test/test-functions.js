const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Initialize Firebase Admin
const app = admin.initializeApp({
  // In production, credentials will be loaded from GOOGLE_APPLICATION_CREDENTIALS
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// Helper function to calculate percentile
function calculatePercentile(numbers, percentile) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper === lower) return sorted[index];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// Helper function to print statistics
function printStatistics(name, numbers) {
  console.log(`\n${name} Statistics (ms):`);
  console.log(`P50: ${calculatePercentile(numbers, 50).toFixed(2)}`);
  console.log(`P95: ${calculatePercentile(numbers, 95).toFixed(2)}`);
  console.log(`P99: ${calculatePercentile(numbers, 99).toFixed(2)}`);
}

async function testFunctions(firstFunctionUrl, executionTimes = 1) {
  const firstFunctionDurations = [];
  const triggerLatencies = [];
  const secondFunctionDurations = [];
  const totalDurations = [];

  try {
    console.log(`Starting test with ${executionTimes} executions...`);
    
    for (let i = 0; i < executionTimes; i++) {
      console.log(`\nExecution ${i + 1}/${executionTimes}`);
      const requestId = `${Date.now()}-${i}`;
      
      // Make request to first function
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

          if (data.firstFunctionEnd) {
            const firstDuration = data.firstFunctionEnd - data.firstFunctionStart;
            console.log('First Function Duration:', firstDuration, 'ms');
          }
          
          if (data.secondFunctionStart && data.firstFunctionEnd) {
            const triggerLatency = data.secondFunctionStart - data.firstFunctionEnd;
            console.log('Trigger Latency:', triggerLatency, 'ms');
          }
          
          if (data.secondFunctionEnd) {
            const secondDuration = data.secondFunctionEnd - data.secondFunctionStart;
            console.log('Second Function Duration:', secondDuration, 'ms');
            console.log('Total Duration:', data.totalDuration, 'ms');
            
            // Store metrics
            firstFunctionDurations.push(data.firstFunctionEnd - data.firstFunctionStart);
            triggerLatencies.push(data.secondFunctionStart - data.firstFunctionEnd);
            secondFunctionDurations.push(data.secondFunctionEnd - data.secondFunctionStart);
            totalDurations.push(data.totalDuration);
            
            // Complete test when we have all the data
            unsubscribe();
            resolve();
          }
        }, reject);

        // Timeout after 60 seconds
        setTimeout(() => {
          unsubscribe();
          reject(new Error('Test timed out waiting for complete timing data'));
        }, 60000);
      });
    }

    // Print summary statistics
    console.log('\n=== Summary Statistics ===');
    printStatistics('First Function Duration', firstFunctionDurations);
    printStatistics('Trigger Latency', triggerLatencies);
    printStatistics('Second Function Duration', secondFunctionDurations);
    printStatistics('Total Duration', totalDurations);

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await app.delete();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const firstFunctionUrl = args[0];
const executionTimes = parseInt(args[1]) || 1;

if (!firstFunctionUrl) {
  console.error('Please provide the first function URL as an argument');
  console.error('Usage: node test-functions.js <url> [executionTimes]');
  console.error('Example: node test-functions.js http://localhost:8080 100');
  process.exit(1);
}

testFunctions(firstFunctionUrl, executionTimes);
