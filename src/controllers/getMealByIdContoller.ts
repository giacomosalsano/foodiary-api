import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { HttpRequest, HttpResponse, ProtectedHttpRequest } from "../types/http";
import { badRequest, created, ok, unauthorized } from "../utils/http";
import { z } from "zod";
import { mealsTable, usersTable } from "../db/schema";


const schema = z.object({
  mealId: z.uuid(),
});


export class GetMealByIdController {
  static async handle({ userId, params }: ProtectedHttpRequest): Promise<HttpResponse> {

  const {success, data, error} = schema.safeParse(params);

  if (!success) {
    return badRequest({
      error: error.issues,
    });
  }
    const meal = await db.query.mealsTable.findFirst({
      columns: {
        id: true,
        name: true,
        icon: true,
        foods: true,
        status: true,
        createdAt: true,
      },
      where: and(
        eq(mealsTable.id, data.mealId),
        eq(mealsTable.userId, userId),
      ),
    });

    return ok({
      meal,
    });
  }
}