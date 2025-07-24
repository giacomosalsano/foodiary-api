# Foodiary API - Complete Documentation

## 📋 Overview

**Foodiary API** is a serverless application built with AWS Lambda that allows users to log and manage their meals by uploading photos or audio. The application uses **real Artificial Intelligence** (OpenAI) for asynchronous food processing and automatic nutritional information calculation.

---

## 🏗️ System Architecture

### Tech Stack
- **Runtime:** Node.js 22.x (ARM64)
- **Framework:** Serverless Framework
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Authentication:** JWT
- **Storage:** AWS S3
- **Queues:** AWS SQS
- **Validation:** Zod
- **Encryption:** bcryptjs
- **AI:** OpenAI (GPT-4 Vision + Whisper)

### Data Flow
```
1. User uploads → 2. S3 Event → 3. SQS → 4. AI Processing → 5. DB Update
```

---

## 📊 Database

### Schema (`src/db/schema.ts`)

#### `users` Table
```typescript
{
  id: uuid (PK),
  email: varchar(255) UNIQUE,
  name: varchar(255),
  password: varchar(255) [hash],
  goal: varchar(8), // 'lose' | 'gain' | 'maintain'
  gender: varchar(6), // 'male' | 'female'
  birthDate: date,
  height: integer,
  weight: integer,
  activityLevel: integer(1-5),
  // Calculated nutritional goals:
  calories: integer,
  proteins: integer,
  carbohydrates: integer,
  fats: integer,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `meals` Table
```typescript
{
  id: uuid (PK),
  userId: uuid (FK),
  name: varchar(255), // Meal name (e.g., "Dinner", "Breakfast")
  icon: varchar(255), // Meal emoji (e.g., "🍗", "🥗")
  status: enum('uploading', 'processing', 'success', 'failed'),
  inputType: enum('audio', 'picture'),
  inputFileKey: varchar(255),
  foods: json, // Array of foods processed by AI
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Analysis:**
- ✅ **Improved structure:** `name` and `icon` fields added for better UX
- ✅ **Flexibility:** `foods` as JSON allows different structures
- ✅ **Traceability:** Status tracking for async processing
- ✅ **Typed enums:** Status and inputType with validation
- ⚠️ **Improvement:** Add indexes for `userId` and `status` for performance
- ⚠️ **Improvement:** Consider normalizing `foods` into a separate table for complex queries

---

## 🤖 Artificial Intelligence

### AI Service (`src/services/ai.ts`)

#### Audio Transcription
```typescript
// Uses OpenAI Whisper for transcription in Portuguese
transcribeAudio(fileBuffer: Buffer) → string
```

#### Text Analysis
```typescript
// Processes transcribed text to extract nutritional information
getMealDetailsFromText({ text, createdAt }) → {
  name: string,    // "Dinner", "Breakfast"
  icon: string,    // "🍗", "🥗"
  foods: Array<{
    name: string,      // "White rice"
    quantity: string,  // "150g"
    calories: number,  // 193
    carbohydrates: number, // 42
    proteins: number,      // 3.5
    fats: number          // 0.4
  }>
}
```

#### Image Analysis
```typescript
// Uses GPT-4 Vision for meal photo analysis
getMealDetailsFromImage({ imageURL, createdAt }) → {
  name: string,
  icon: string,
  foods: Array<FoodItem>
}
```

**Analysis:**
- ✅ **Real AI:** Full implementation with OpenAI
- ✅ **Multimodal:** Supports audio and image
- ✅ **Contextual:** Considers meal time
- ✅ **Structured:** Standardized JSON response
- ✅ **Portuguese:** Processing in Brazilian Portuguese
- ⚠️ **Improvement:** Implement cache for similar results
- ⚠️ **Improvement:** Add fallback for AI errors

---

## 🔐 Authentication & Security

### JWT (`src/lib/jwt.ts`)
```typescript
// Generates access token valid for 7 days
signAccessTokenFor(userId: string) → string

// Verifies and extracts userId from token
verifyAccessToken(token: string) → string | null
```

**Analysis:**
- ✅ **Simplicity:** Direct and functional implementation
- ✅ **Security:** Tokens expire in 7 days
- ✅ **Type safety:** Well-typed with TypeScript
- ⚠️ **Improvement:** Implement refresh tokens
- ⚠️ **Improvement:** Add blacklist for logout
- ⚠️ **Improvement:** Use environment variables for config

### Encryption (`bcryptjs`)
- Passwords hashed with salt rounds = 8
- Secure comparison with `compare()`

---

## 🧮 Nutritional Goals Calculation

### `src/lib/calculateGoals.ts`

**Formula used:**
1. **BMR (Basal Metabolic Rate):**
   - Men: `88.36 + 13.4 × weight + 4.8 × height - 5.7 × age`
   - Women: `447.6 + 9.2 × weight + 3.1 × height - 4.3 × age`

2. **TDEE (Total Daily Energy Expenditure):**
   - `BMR × Activity Multiplier`

3. **Goals based on objective:**
   - Maintain: TDEE
   - Gain: TDEE + 500 cal
   - Lose: TDEE - 500 cal

4. **Macronutrient Distribution:**
   - Proteins: `weight × 2g`
   - Fats: `weight × 0.9g`
   - Carbs: `(calories - proteins×4 - fats×9) ÷ 4`

**Analysis:**
- ✅ **Scientifically valid:** Formulas based on studies
- ✅ **Flexible:** Supports different goals and activity levels
- ✅ **Type safety:** Well-typed with TypeScript
- ⚠️ **Improvement:** Add input validation
- ⚠️ **Improvement:** Consider individual factors (body composition, etc.)

---

## 🎯 Controllers

### 1. SignUpController (`src/controllers/signUpController.ts`)

**Functionality:** User registration with automatic goal calculation

**Flow:**
1. Validates data with Zod (goal, gender, birthDate, height, weight, activityLevel, account)
2. Checks if email already exists
3. Automatically calculates nutritional goals
4. Hashes password with bcrypt
5. Inserts user into database
6. Generates JWT
7. Returns user data + token

**Analysis:**
- ✅ **Robust validation:** Complete Zod schema
- ✅ **Security:** Password hashed
- ✅ **UX:** Returns token automatically
- ✅ **Automatic calculation:** Nutritional goals calculated on signup
- ⚠️ **Improvement:** Add password strength validation
- ⚠️ **Improvement:** Implement email verification

### 2. SignInController (`src/controllers/signInController.ts`)

**Functionality:** User authentication

**Flow:**
1. Validates email/password with Zod
2. Finds user in database
3. Compares password with bcrypt
4. Generates JWT
5. Returns user data + token

**Analysis:**
- ✅ **Security:** Generic message for invalid credentials
- ✅ **Performance:** Query only necessary fields
- ✅ **Validation:** Zod for input
- ⚠️ **Improvement:** Implement rate limiting
- ⚠️ **Improvement:** Add login attempt logs

### 3. MeController (`src/controllers/meController.ts`)

**Functionality:** Returns logged-in user data

**Flow:**
1. Uses userId from JWT (already validated)
2. Fetches user data
3. Returns nutritional information

**Analysis:**
- ✅ **Simplicity:** Direct endpoint
- ✅ **Security:** Uses ProtectedHttpRequest
- ✅ **Nutritional data:** Returns calculated goals
- ⚠️ **Improvement:** Add cache for static data

### 4. CreateMealController (`src/controllers/createMealController.ts`)

**Functionality:** Starts meal creation process

**Flow:**
1. Validates file type (audio/photo) with Zod
2. Generates UUID for file
3. Creates S3 presigned URL (10 min)
4. Inserts meal with status 'uploading'
5. Returns mealId + uploadUrl

**Analysis:**
- ✅ **Security:** Presigned URLs with expiration
- ✅ **Flexibility:** Supports audio and image
- ✅ **Validation:** Zod for file types
- ⚠️ **Improvement:** Validate max file size
- ⚠️ **Improvement:** Implement orphan meal cleanup

### 5. ListMealsController (`src/controllers/listMealsController.ts`)

**Functionality:** Lists meals by date

**Flow:**
1. Validates date parameter with Zod
2. Fetches user's meals for the date
3. Filters only meals with status 'success'

**Analysis:**
- ✅ **Performance:** Query optimized with indexes
- ✅ **Security:** Filters by userId
- ✅ **Validation:** Zod for date
- ✅ **Temporal filter:** Search by specific date
- ⚠️ **Improvement:** Add pagination
- ⚠️ **Improvement:** Implement cache

### 6. GetMealByIdController (`src/controllers/getMealByIdContoller.ts`)

**Functionality:** Fetches a specific meal

**Flow:**
1. Validates mealId (UUID) with Zod
2. Fetches user's meal
3. Returns complete data

**Analysis:**
- ✅ **Security:** UUID validation
- ✅ **Isolation:** User only sees their meals
- ✅ **Validation:** Zod for UUID
- ⚠️ **Improvement:** Add cache for frequently accessed meals

---

## 🔄 Lambda Functions

### Standard Structure
All functions follow the pattern:
```typescript
1. Parse event (common/protected)
2. Call controller
3. Parse response
4. Handle authentication errors
```

### Public Functions
- `signIn`: Login
- `signUp`: Registration

### Protected Functions
- `me`: User data
- `createMeal`: Create meal
- `listMeals`: List meals
- `getMealById`: Fetch meal

### System Functions
- `fileUploadedEvent`: Trigger S3 → SQS
- `processMeal`: Processes SQS messages

**Analysis:**
- ✅ **Consistency:** Uniform pattern in all functions
- ✅ **Separation:** Business logic in controllers
- ✅ **Error handling:** Try/catch for authentication
- ✅ **Timeout:** 25 seconds for all functions
- ⚠️ **Improvement:** Implement structured logging
- ⚠️ **Improvement:** Add performance metrics

---

## 📁 Utilities

### Parse Event (`src/utils/parseEvent.ts`)
```typescript
// Converts APIGatewayProxyEventV2 to HttpRequest
{
  body: JSON.parse(event.body),
  params: event.pathParameters,
  queryParams: event.queryStringParameters
}
```

### Parse Protected Event (`src/utils/parseProtectedEvent.ts`)
```typescript
// Adds JWT validation to parseEvent
// Extracts userId from token
// Throws error if token is invalid
```

### HTTP Responses (`src/utils/http.ts`)
```typescript
ok(200), created(201), badRequest(400), 
conflict(409), unauthorized(401)
```

**Analysis:**
- ✅ **Reusability:** Centralized utilities
- ✅ **Type safety:** Well-typed with TypeScript
- ✅ **Consistency:** Uniform response pattern
- ⚠️ **Improvement:** Add more status codes (404, 500, etc.)

---

## 🗂️ AWS Clients

### S3 Client (`src/clients/s3Clients.ts`)
```typescript
// Standard AWS SDK v3 client
// Uses environment credentials
```

### SQS Client (`src/clients/sqsClient.ts`)
```typescript
// Standard AWS SDK v3 client
// For processing message sending
```

**Analysis:**
- ✅ **Simplicity:** Proper default configuration
- ✅ **Consistency:** AWS SDK v3 throughout the project
- ⚠️ **Improvement:** Add retry policies
- ⚠️ **Improvement:** Set specific timeouts

---

## 🔄 Asynchronous Processing

### Processing Flow
```
1. User uploads → S3
2. S3 Event → Lambda fileUploadedEvent
3. Lambda sends message → SQS
4. Lambda processMeal processes message
5. AI processes file (audio/image)
6. Updates meal status
```

### ProcessMeal (`src/queues/ProcessMeal.ts`)

**Functionality:** Processes meals in the background with AI

**Flow:**
1. Fetches meal by fileKey
2. Checks if already processed
3. Updates status to 'processing'
4. **Real AI:**
   - **Audio:** Transcribes with Whisper → Analyzes with GPT-4
   - **Image:** Analyzes with GPT-4 Vision
5. Updates with processed data (name, icon, foods)
6. On error, marks as 'failed'

**Analysis:**
- ✅ **Real AI:** Full implementation with OpenAI
- ✅ **Resilience:** Proper error handling
- ✅ **Idempotency:** Prevents reprocessing
- ✅ **Multimodal:** Supports audio and image
- ✅ **Data structure:** `name` and `icon` fields added
- ⚠️ **Improvement:** Add retry with backoff
- ⚠️ **Improvement:** Implement dead letter queue

---

## 🚀 Serverless Configuration

### `serverless.yml`

**AWS Resources:**
- **S3 Bucket:** `foodiary-uploads-jstack-lab-giacomo`
- **SQS Queue:** `foodiary-meals-queue-jstack-lab-giacomo`
- **DLQ:** `foodiary-meals-dlq-jstack-lab-giacomo`

**IAM Permissions:**
- S3: PutObject, GetObject
- SQS: SendMessage

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL URL
- `JWT_SECRET`: JWT secret
- `UPLOADS_BUCKET_NAME`: S3 bucket name
- `MEALS_QUEUE_URL`: SQS queue URL
- `OPENAI_API_KEY`: OpenAI API key

**Analysis:**
- ✅ **Security:** Minimum required permissions
- ✅ **Organization:** Descriptive names
- ✅ **Resilience:** Dead letter queue configured
- ✅ **Configuration:** Well-organized environment variables
- ⚠️ **Improvement:** Add tags for organization
- ⚠️ **Improvement:** Set S3 lifecycle

---

## 📦 Dependencies

### Production
- `@aws-sdk/client-s3`: S3 client
- `@aws-sdk/client-sqs`: SQS client
- `@aws-sdk/s3-request-presigner`: Presigned URLs
- `@neondatabase/serverless`: PostgreSQL driver
- `bcryptjs`: Password encryption
- `drizzle-orm`: Database ORM
- `jsonwebtoken`: JWT
- `openai`: OpenAI client
- `zod`: Data validation

### Development
- `@types/aws-lambda`: Lambda types
- `@types/jsonwebtoken`: JWT types
- `@types/node`: Node.js types
- `dotenv`: Environment variables
- `drizzle-kit`: Drizzle tools
- `serverless-offline`: Local development
- `tsx`: TypeScript execution
- `typescript`: TypeScript compiler

---

## 📈 Project Strengths

1. **Real AI Implemented:** OpenAI for food processing
2. **Well-structured architecture:** Clear separation of responsibilities
3. **Security:** JWT, bcrypt, Zod validation
4. **Scalability:** Serverless + async processing
5. **Type safety:** TypeScript throughout the project
6. **Consistent patterns:** Uniform function structure
7. **Multimodal:** Supports audio and image
8. **Nutritional calculations:** Based on scientific formulas
9. **Async processing:** Full S3 → SQS → Lambda flow
10. **Improved UX:** Meal names and icons

---

## 🔧 Suggested Improvements

### High Priority
1. **Implement cache** for AI results
2. **Add more robust input validation**
3. **Implement structured logging**
4. **Add unit and integration tests**
5. **Set up monitoring** (CloudWatch, X-Ray)

### Medium Priority
1. **Implement retry** with exponential backoff
2. **Add pagination** to listings
3. **Implement rate limiting**
4. **Add refresh tokens**
5. **Set up automated CI/CD**

### Low Priority
1. **Add OpenAPI/Swagger documentation**
2. **Implement API versioning**
3. **Add business metrics**
4. **Optimize queries** with indexes
5. **Implement automatic backup**

---

## 🎯 Conclusion

The **Foodiary API** project has evolved significantly and now features:

- **Real AI:** Full implementation with OpenAI for food processing
- **Multimodal processing:** Supports audio (Whisper) and image (GPT-4 Vision)
- **Robust architecture:** Serverless with async processing
- **Proper security:** JWT, bcrypt, Zod validation
- **Improved UX:** Meal names and icons
- **Clean code:** Well-structured TypeScript

The application is **production-ready** with complete food processing features via AI. The current focus should be on implementing automated tests and monitoring to ensure production stability.
