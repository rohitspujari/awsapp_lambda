const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB();
const s3 = new AWS.S3();
exports.handler = (event, context, callback) => {
    // TODO implement
    console.log('Printing Event:', event)
    console.log('printing Context:', context)
    
    const { batchJobId, deleteKey, bucket } = event.detail.userMetadata;
    console.log('printing AWS Batch Job ID', batchJobId, deleteKey, bucket)
    
    // Delete the .mp4 file 
    
    // Update the table status
    deleteOldFile(bucket, deleteKey)
    updateTable(batchJobId, callback)
    //callback(null, {event, context});
    
};


const deleteOldFile = (bucket, deleteKey) => {
    var params = {
        Bucket: bucket, 
        Key: deleteKey
    };
 s3.deleteObject(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else     console.log(data);           // successful response
   /*
   data = {
   }
   */
 });
}


const updateTable = (batchJobId, callback) => {
    var params = {
        TableName: 'r_batch_jobs',
        Key: {
            batchJobId: {
                S: String(batchJobId)
        }
    },
    UpdateExpression:
      'SET mediaConvertJobCompleted=:mcjc',
    ExpressionAttributeValues: {
      ':mcjc': {
        S: String(new Date(Date.now()))
      }
    },
    ReturnValues: 'UPDATED_NEW'
  };

  dynamo.updateItem(params, (err, result) => {
    if (err) console.log(err);
    else {
        console.log('Successfully updated status.')
        callback(null,'Successfully updated status.' )
    }
  });
}