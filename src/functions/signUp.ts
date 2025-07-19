import { APIGatewayProxyEventV2 } from "aws-lambda";
import { SignUpController } from "../controllers/signUpController";
import { parseEvent } from "../utils/parseEvent";
import { parseResponse } from "../utils/parseResponse";

export async function handler(event: APIGatewayProxyEventV2) {
  const { body, params, queryParams } = parseEvent(event);

  const response = await SignUpController.handle({
    body,
    params,
    queryParams,
  });

  return parseResponse(response);
}