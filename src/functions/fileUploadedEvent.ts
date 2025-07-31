import { S3Event } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "../clients/sqsClient";

export async function handler(event: S3Event) {
  console.log('S3 Event received:', JSON.stringify(event, null, 2));
  
  try {
    await Promise.all(
      event.Records.map(async record => {
        console.log('Processing record:', record.s3.object.key);
        
        const command = new SendMessageCommand({
          QueueUrl: process.env.MEALS_QUEUE_URL,
          MessageBody: JSON.stringify({
            fileKey: record.s3.object.key,
          }),
        });

        const result = await sqsClient.send(command);
        console.log('Message sent to SQS:', result);
        return result;
      })
    );
    
    console.log('All records processed successfully');
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
}