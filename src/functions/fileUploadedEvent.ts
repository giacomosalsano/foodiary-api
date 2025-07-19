import { S3Event } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "../clients/sqsClient";

export async function handler(event: S3Event) {
  await Promise.all(
    event.Records.map(async record => {
      const command = new SendMessageCommand({
        QueueUrl: process.env.MEALS_QUEUE_URL,
        MessageBody: JSON.stringify({
          fileKey: record.s3.object.key,
        }),
      });

      return await sqsClient.send(command);
    })
  )
}