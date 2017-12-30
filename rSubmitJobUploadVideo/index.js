const AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
  //const link = 'https://www.youtube.com/watch?v=K5BoE8eBzoI'
  const  { link } =  event['body-json'];
  const  cognitoID = event.context['cognito-identity-id']; 
  const batch = new AWS.Batch();
  const params = {
    jobDefinition: 'r-youtube-video',
    jobName: 'upload_video_' + Date.now(),
    jobQueue: 'r-high-priority-youtube-videos',
    parameters: {
    'url': link,
    'bucket':'storage.ruletheglobe.com/private/'+cognitoID
    /* '<String>': ... */
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
    callback(null, data);
  });
    
};