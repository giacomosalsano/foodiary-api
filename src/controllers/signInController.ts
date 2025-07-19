import { eq } from "drizzle-orm";
import { db } from "../db";
import { HttpRequest, HttpResponse } from "../types/http";
import { badRequest, ok, unauthorized } from "../utils/http";
import { z } from "zod";
import { usersTable } from "../db/schema";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { signAccessTokenFor } from "../lib/jwt";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export class SignInController {
  static async handle({ body }: HttpRequest): Promise<HttpResponse> {
    const { success, error, data } = schema.safeParse(body);

    if (!success) {
      return badRequest({ errors: error.issues, message: "Invalid data!" });
    }


    const user = await db.query.usersTable.findFirst({
      columns: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
      where: eq(usersTable.email, data.email),
    });

    if (!user) {
      return unauthorized({ message: "Invalid credentials!" });
    }

    const isPasswordValid = await compare(data.password, user.password);

    if (!isPasswordValid) {
      return unauthorized({ message: "Invalid credentials!" });
    }

    const accessToken = signAccessTokenFor(user.id);

    return ok({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      message: `Welcome ${user.name}!`,
    });
  }
}