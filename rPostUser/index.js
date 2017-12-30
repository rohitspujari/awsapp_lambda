var doc = require('aws-sdk');
var dynamo = new doc.DynamoDB();

exports.handler = (event, context, callback) => {
  var id = "";
  var identityProivder = "";
  var authenticated = false
  
  if (event.context && event.context['cognito-identity-id'] !== '') {
    id = event.context['cognito-identity-id'];
    identityProivder = event.context['cognito-authentication-provider'];
    authenticated = event.context['cognito-authentication-type'] ==='authenticated'? true: false
  }
  
  const {username, name, email} = event['body-json'];

  var params = {
    TableName: 'r_users',
    Item: {
      userid: {
        S: String(id)
      },
      username: {
        S: String(username)
      },
      name: {
        S: String(name)
      },
      email: {
        S: String(email)
      },
      identity_provider: {
        S: String(identityProivder)
      },
      authenticated: {
        BOOL: authenticated
      },
      
      last_session: {
        S: String(new Date(Date.now()))
      }
    },
    ReturnConsumedCapacity: 'TOTAL',
    ReturnValues: 'ALL_OLD'
  };

  dynamo.putItem(params, (err, data) => {
    if (err)
      console.log(err, err.stack); // an error occurred
    else callback(null, { data, event, username, email, name }); // successful response
    /*
  data = {
    ConsumedCapacity: {
    CapacityUnits: 1, 
    TableName: "Music"
    }
  }
  */
  });
};
