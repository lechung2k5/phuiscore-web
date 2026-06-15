const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const isLocal = process.env.NODE_ENV !== 'production';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-southeast-1", 
    endpoint: isLocal ? (process.env.DYNAMODB_ENDPOINT || "http://localhost:8000") : undefined,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || (isLocal ? "local" : ""),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || (isLocal ? "local" : "")
    }
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

module.exports = { client, docClient };
