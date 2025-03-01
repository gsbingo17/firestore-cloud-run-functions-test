const functions = require('@google-cloud/functions-framework');
const { db } = require('./src/config');

// Register HTTP function
functions.http('modifyDocument', async (req, res) => {
  try {
    const requestId = req.headers['x-request-id'] || Date.now().toString();
    const startTime = Date.now();

    // Log the start of the operation
    await db.collection('timing').doc(requestId).set({
      firstFunctionStart: startTime,
      requestId
    });

    // Modify a document in the 'items' collection
    // This will trigger the second function
    await db.collection('items').doc(requestId).set({
      timestamp: startTime,
      message: 'Modified by first function',
      requestId
    });

    // Log completion time
    await db.collection('timing').doc(requestId).update({
      firstFunctionEnd: Date.now()
    });

    res.json({
      success: true,
      requestId,
      message: 'Document modified successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
