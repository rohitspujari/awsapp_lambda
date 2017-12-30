
var AWS = require('aws-sdk');
var fs = require('fs');
var youtubedl = require('youtube-dl');

exports.handler = (event, context, callback) => {
    // TODO implement
    
   
    var video = youtubedl('http://www.youtube.com/watch?v=90AiXO1pAiA'
  // Optional arguments passed to youtube-dl.
  //['--format=18']
  // Additional options can be given for calling `child_process.execFile()`.
  //{ cwd: '/tmp' }
  );

// Will be called when the download starts.

const metadata = {}

video.on('info', function(info) {
 // console.log(info)
  console.log('Download started');
  console.log('filename: ' + info._filename);
  metadata.filename = info._filename
  console.log('size in MB: ' + info.size/1000000);
});

writer = fs.createWriteStream('/tmp/myvideo.mp4')

writer.on('finish', () => {
  console.error('All writes are now complete.');

  fs.readFile('/tmp/myvideo.mp4', function(err, data) {
    if (err) {
      throw err;
    }

    var base64data = new Buffer(data, 'binary');

    var s3 = new AWS.S3();
    s3.putObject(
      {
        Bucket: 'deletebucket-today',
        Key: metadata.filename,
        Body: base64data,
        ACL: 'public-read'
      },
      function(resp) {
        console.log(arguments);
        console.log('Successfully uploaded video.');
        callback(null, {resp, arguments});
      }
    );
  });
});


video.pipe(writer);









    
};