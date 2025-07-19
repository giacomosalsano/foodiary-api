import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { mealsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export class ProcessMealController {
  static async process({ fileKey }: {fileKey: string}) {
    const meal = await db.query.mealsTable.findFirst({
      where: eq(mealsTable.inputFileKey, fileKey),
    })

    if (!meal) {
      throw new Error('Meal not found!');
    }

    if (meal.status === 'failed' || meal.status === 'success') {
      return
    }

    await db.update(mealsTable).set({
      status: 'processing',
    }).where(eq(mealsTable.id, meal.id));

    try{
      //CHAMAR A IA

      await db.update(mealsTable).set({
        status: 'success',
        name: 'Meal name',
        icon: 'Meal icon',
        foods: [
          {
            name: 'Food name',
            quantity: 100,
            unit: 'g',
            calories: 100,
            proteins: 10,
            carbohydrates: 10,
            fats: 10,
          }
        ],
      }).where(eq(mealsTable.id, meal.id));
    } catch {
      await db.update(mealsTable).set({
        status: 'failed',
      }).where(eq(mealsTable.id, meal.id));
    }
  }
}