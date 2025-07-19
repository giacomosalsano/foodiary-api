import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ProtectedHttpRequest } from "../types/http";
import { parseEvent } from "./parseEvent";
import { verifyAccessToken } from "../lib/jwt";

export function parseProtectedEvent(event: APIGatewayProxyEventV2): ProtectedHttpRequest {
    const baseEvent = parseEvent(event);  
    const {authorization} = event.headers;

    if (!authorization) {
        throw new Error('Access token is required!');
    }

    const [, token] = authorization.split(' ');

    const userId = verifyAccessToken(token);

    if (!userId) {
        throw new Error('Invalid access token!');
    }


    return {
      ...baseEvent,
      userId
    }
}