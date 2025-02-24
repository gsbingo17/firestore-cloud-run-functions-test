const functions = require('@google-cloud/functions-framework');
const { db } = require('./config');
const protobuf = require('protobufjs');

// Register a Firestore trigger function
functions.cloudEvent('onItemChange', async (cloudEvent) => {
  try {
    const startTime = Date.now();
    console.log(`Function triggered by event on: ${cloudEvent.source}`);
    console.log(`Event type: ${cloudEvent.type}`);

    // Load the Firestore event data type
    console.log('Loading protos...');
    const root = await protobuf.load('data.proto');
    const DocumentEventData = root.lookupType(
      'google.events.cloud.firestore.v1.DocumentEventData'
    );

    // Decode the protobuf data
    console.log('Decoding data...');
    const firestoreReceived = DocumentEventData.decode(cloudEvent.data);
    
    console.log('\nOld value:');
    console.log(JSON.stringify(firestoreReceived.oldValue, null, 2));
    
    console.log('\nNew value:');
    console.log(JSON.stringify(firestoreReceived.value, null, 2));

    // Extract requestId from the document fields
    const requestId = firestoreReceived.value?.fields?.requestId?.stringValue;
    const timestamp = parseInt(
      firestoreReceived.value?.fields?.timestamp?.integerValue || 
      firestoreReceived.value?.fields?.timestamp?.doubleValue
    );

    if (!requestId) {
      console.warn('No requestId found in document data');
      return;
    }

    // Log the start of second function
    await db.collection('timing').doc(requestId).update({
      secondFunctionStart: startTime,
      eventSource: cloudEvent.source,
      eventType: cloudEvent.type
    });

    // Perform some operation
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work

    // Log completion and calculate total time
    const endTime = Date.now();
    await db.collection('timing').doc(requestId).update({
      secondFunctionEnd: endTime,
      totalDuration: endTime - timestamp,
      // Additional metadata about the trigger
      triggerDetails: {
        eventType: cloudEvent.type,
        eventTime: cloudEvent.time,
        documentPath: firestoreReceived.value?.name
      }
    });

    console.log(`Completed processing for requestId: ${requestId}`);
  } catch (error) {
    console.error('Error in second function:', error);
    throw error; // This will trigger Cloud Run's retry mechanism
  }
});
