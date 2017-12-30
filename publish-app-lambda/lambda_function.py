import boto3 
from botocore.client import Config
import StringIO
import zipfile
import mimetypes
import ConfigParser

def lambda_handler(event, context):
    
    # Get Resources from .ini file
    conf_file = ConfigParser.ConfigParser()
    conf_file.read('resources.ini')
    sns_topic = conf_file.get('resource', 'sns_topic')
    b_bucket = conf_file.get('resource', 'build_bucket')
    p_bucket = conf_file.get('resource', 'publish_bucket')
    b_artifact = conf_file.get('resource', 'build_artifact')
    
    sns = boto3.resource('sns')
    topic = sns.Topic(sns_topic)
    
    s3 = boto3.resource('s3',config=Config(signature_version='s3v4'))
    
    location = {
        'bucketName': b_bucket,
        'objectKey': b_artifact
    }
    
    try:
        
        # Check if the lambda is invoked by codepipeline
        # http://docs.aws.amazon.com/codepipeline/latest/userguide/actions-invoke-lambda-function.html
        job = event.get('CodePipeline.job')
        if job:
            for artifact in job['data']['inputArtifacts']:
                if artifact['name'] == 'MyAppBuild':
                    location = artifact['location']['s3Location']
        print 'Building App from ' + str(location)
        print '=========='
            
        
        build_bucket = s3.Bucket(location['bucketName'])
        publish_bucket = s3.Bucket(p_bucket)
        zipped_app = StringIO.StringIO() # In-memory location 
        build_bucket.download_fileobj(location['objectKey'], zipped_app) # Download the b_artifact in in-memory location
        
        with zipfile.ZipFile(zipped_app) as myzip:
            for f in myzip.namelist():
                obj = myzip.open(f)
                # Some mimetypes.guess_type is best effort guess. If it's unable to guess the mimetype it will output 'None' which will result into an error.  
                # print  str({
                #     'key': f, 'value': mimetypes.guess_type(f)[0] 
                # })
                publish_bucket.upload_fileobj(obj, f, 
                    ExtraArgs={'ContentType': 'application/json' if mimetypes.guess_type(f)[0] == None else mimetypes.guess_type(f)[0] })
                
                
                publish_bucket.Object(f).Acl().put(ACL='public-read')
                
        print 'Job done!'
        topic.publish(Subject='App Deployed', Message='Your react application has been deployed successfully\nBuild Location: ' + str(location))
        
        # Notify Codepipeline that lamdba invokation was successful
        if job:
            codepipeline = boto3.client('codepipeline')
            codepipeline.put_job_success_result(jobId=job['id'])
        
    except:
        topic.publish(Subject='App Deploy Failed', Message='Could not upload your build artifacts into hosted s3 bucket.\nBuild Location: '+str(location))
        raise
    
    return 'Lambda Execution Finished.'