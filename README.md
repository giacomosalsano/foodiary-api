# Foodiary API

Serverless API for logging, analyzing, and tracking meals using Artificial Intelligence (OpenAI). Allows photo or audio uploads, automatically processes foods, and calculates personalized nutritional information.

## 🚀 Main Features
- Upload meals by **photo** or **audio**
- Automatic processing with **real AI** (OpenAI Whisper + GPT-4 Vision)
- Calorie and macronutrient calculation
- Personalized nutritional goals
- JWT authentication
- Scalable and asynchronous architecture (AWS Lambda, S3, SQS)

## 🏗️ Tech Stack
- **Node.js 22.x**
- **TypeScript**
- **Serverless Framework**
- **PostgreSQL + Drizzle ORM**
- **AWS S3 & SQS**
- **OpenAI API**
- **Zod** (validation)
- **bcryptjs** (encryption)

<div align="center" style="display: inline_block"><br>
  <img src="https://skillicons.dev/icons?i=ts,nodejs,postgres,aws,github,npm&perline=10" alt="icons" />
</div>

## ⚡ How to Run Locally
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env`):
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
4. Run in offline mode:
   ```bash
   npm run dev
   ```

## 📚 Learn More
For full details on architecture, database, flows, examples, and improvement suggestions, check the [complete documentation](https://github.com/giacomosalsano/foodiary-api/blob/main/documentation.md).

---

made with ♥ by [giacomosalsano](https://giacomosalsano.com)! 