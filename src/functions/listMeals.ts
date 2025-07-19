import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ListMealsController } from "../controllers/listMealsController";
import { parseProtectedEvent } from "../utils/parseProtectedEvent";
import { parseResponse } from "../utils/parseResponse";
import { unauthorized } from "../utils/http";

export async function handler(event: APIGatewayProxyEventV2) {
  try {
    const request = parseProtectedEvent(event);
    const response = await ListMealsController.handle(request);
    
    return parseResponse(response);
  } catch  {
    return parseResponse(
      unauthorized({
        error: 'Invalid access token!',
      }),
    );
  }
}