import { eq } from "drizzle-orm";
import { db } from "../db";
import { HttpRequest, HttpResponse, ProtectedHttpRequest } from "../types/http";
import { badRequest, ok, unauthorized } from "../utils/http";
import { z } from "zod";
import { usersTable } from "../db/schema";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { signAccessTokenFor } from "../lib/jwt";



export class MeController {
  static async handle({ userId }: ProtectedHttpRequest): Promise<HttpResponse> {
    const user = await db.query.usersTable.findFirst({
      columns: {
        id: true,
        name: true,
        email: true,
        calories: true,
        proteins: true,
        carbohydrates: true,
        fats: true,
      },
      where: eq(usersTable.id, userId),
    });

    if (!user) {
      return unauthorized({
        error: 'User not found!',
      });
    }

    return ok({
      user,
    });
  }
}