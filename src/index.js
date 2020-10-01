const AWS = require('aws-sdk');
const crypto = require("crypto");
// Generate unique id with no external dependencies
const generateUUID = () => crypto.randomBytes(16).toString("hex");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const processResponse = require('./process-response.js');
const TABLE_NAME = process.env.TABLE_NAME,
  PRIMARY_KEY = process.env.PRIMARY_KEY,
  IS_CORS = true;

exports.handler = async (event,context) => {
  if (event.httpMethod === 'OPTIONS') {
    return processResponse(IS_CORS);
  }
  console.log("--request: " + JSON.stringify(event));
  if (!event.body) {
    return processResponse(IS_CORS, 'invalid', 400);
  }
  const {body} = JSON.parse(event.body);

  const item = {}
  item[PRIMARY_KEY] = generateUUID();
  item["title"] = body.title


  //const UUID = context.awsRequestId;  
  const params = {
    TableName: TABLE_NAME,
    Item: item
  }
  try {
    await dynamoDb.put(params).promise()
    return processResponse(IS_CORS);
  } catch (error) {
    let errorResponse = `Error: Execution update, caused a Dynamodb error, please look at your logs.`;
    if (error.code === 'ValidationException') {
      if (error.message.includes('reserved keyword')) errorResponse = `Error: You're using AWS reserved keywords as attributes`;
    }
    console.log(error);
    return processResponse(IS_CORS, errorResponse, 500);
  }
};
