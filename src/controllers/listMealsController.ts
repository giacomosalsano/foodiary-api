import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { HttpRequest, HttpResponse, ProtectedHttpRequest } from "../types/http";
import { badRequest, created, ok, unauthorized } from "../utils/http";
import { z } from "zod";
import { mealsTable, usersTable } from "../db/schema";


const schema = z.object({
  date: z.iso.date().transform(dateStr => new Date(dateStr)),
});


export class ListMealsController {
  static async handle({ userId, queryParams }: ProtectedHttpRequest): Promise<HttpResponse> {

  const {success, data, error} = schema.safeParse(queryParams);

  if (!success) {
    return badRequest({
      error: error.issues,
    });
  }

  const endDate = new Date(data.date);
  endDate.setUTCHours(23, 59, 59, 999);

    const meals = await db.query.mealsTable.findMany({
      columns: {
        id: true,
        name: true,
        icon: true,
        foods: true,
        status: true,
        createdAt: true,
      },
      where: and(
        eq(mealsTable.userId, userId),
        gte(mealsTable.createdAt, data.date),
        lte(mealsTable.createdAt, endDate),
        eq(mealsTable.status, 'success'),
      ),
    });

    return ok({
      meals,
    });
  }
}