const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB();

exports.handler = (event, context, callback) => {
  //const link = 'https://www.youtube.com/watch?v=K5BoE8eBzoI'
  //const cognitoID = 'no-id'
  const  { link } =  event['body-json'];
  const  cognitoID = event.context['cognito-identity-id'];
  const bucket = 'storage.ruletheglobe.com/private/'+cognitoID;
  const jobQueue = 'high-priority';
  const jobName = 'upload_video_' + Date.now();
  const batch = new AWS.Batch();
  
  const params = {
    jobDefinition: 'r-youtube-video',
    jobName,
    jobQueue,
    parameters: {
    'url': link,
    'bucket':bucket
    }
  };
  
  batch.submitJob(params, function(err, data) {
    if (err)
      callback(err, err.stack); // an error occurred
    else console.log(data); // successful response
    /*
    data = {
     jobId: "876da822-4198-45f2-a252-6cea32512ea8", 
     jobName: "example"
    }
    */
    // Update rFiles Table
    updateTable(cognitoID, data, jobQueue, link, bucket, callback)
  });
    
};


const updateTable = (userid, data, jobQueue, uri, bucket, callback) => {
  var params = {
    TableName:  'r_batch_jobs',
    Item: {
      batchJobId: {
        S: String(data.jobId)
      },
      userId: {
        S: String(userid)
      },
      uri: {
        S: String(uri)
      },
      bucket: {
        S: 'storage.ruletheglobe.com'
      },
      batchJobSumbitted: {
        S: String(new Date(Date.now()))
      }
    },
    ReturnConsumedCapacity: 'TOTAL',
    ReturnValues: 'ALL_OLD'
  };
  
  dynamo.putItem(params, (err, result) => {
    if (err)
      callback(err); /*global callback*/ // an error occurred
    else callback(null, data);
    //else callback(null, { data, event }); /*global callback*/ // successful response
    
  });
}