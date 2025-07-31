import { eq } from "drizzle-orm";
import { db } from "../db";
import { HttpRequest, HttpResponse, ProtectedHttpRequest } from "../types/http";
import { badRequest, created, ok, unauthorized } from "../utils/http";
import { z } from "zod";
import { mealsTable, usersTable } from "../db/schema";
import { randomUUID } from "crypto";

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client } from "../clients/s3Clients";

const schema = z.object({
  fileType: z.enum(['audio/m4a', 'picture/jpeg']),
});


export class CreateMealController {
  static async handle({ userId, body }: ProtectedHttpRequest): Promise<HttpResponse> {

  const {success, data, error} = schema.safeParse(body);

  if (!success) {
    return badRequest({
      error: error.issues,
    });
  }

  const fileId = randomUUID()
  const ext = data.fileType.split('/')[1]; 
  const fileKey = `${fileId}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.UPLOADS_BUCKET_NAME,
    Key: fileKey,
    ContentType: data.fileType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 600,
  });

  const [meal]  = await db.insert(mealsTable).values({
    userId,
    inputFileKey: fileKey,
    inputType: data.fileType === 'audio/m4a' ? 'audio' : 'picture',
    status: 'uploading',
    icon: '',
    name: '',
    foods: []
  }).returning({id: mealsTable.id});

  return created({
    mealId: meal.id,
    uploadUrl: presignedUrl,
  });
  }
}