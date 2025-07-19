import { SQSEvent } from "aws-lambda";
import { ProcessMealController } from "../queues/processMealController";

export async function handler(event: SQSEvent) {
  await Promise.all(
    event.Records.map(async record => {
      const body = JSON.parse(record.body);

      await ProcessMealController.process(body);
    })
  )
}