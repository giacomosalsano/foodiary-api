# Foodiary API - Documentação Completa

## 📋 Visão Geral

O **Foodiary API** é uma aplicação serverless construída com AWS Lambda que permite aos usuários registrar e gerenciar suas refeições através de upload de fotos ou áudios. A aplicação utiliza processamento assíncrono para analisar os alimentos e calcular informações nutricionais.

**URL da API:** `https://hcnruwnjwa.execute-api.us-east-1.amazonaws.com/`

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica
- **Runtime:** Node.js 22.x (ARM64)
- **Framework:** Serverless Framework
- **Banco de Dados:** PostgreSQL (Neon) + Drizzle ORM
- **Autenticação:** JWT
- **Storage:** AWS S3
- **Filas:** AWS SQS
- **Validação:** Zod
- **Criptografia:** bcryptjs

### Fluxo de Dados
```
1. Usuário faz upload → 2. S3 Event → 3. SQS → 4. Processamento IA → 5. Atualização DB
```

---

## 📊 Banco de Dados

### Schema (`src/db/schema.ts`)

#### Tabela `users`
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
  // Metas nutricionais calculadas:
  calories: integer,
  proteins: integer,
  carbohydrates: integer,
  fats: integer,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Tabela `meals`
```typescript
{
  id: uuid (PK),
  userId: uuid (FK),
  name: varchar(255),
  icon: varchar(255),
  status: enum('uploading', 'processing', 'success', 'failed'),
  inputType: enum('audio', 'picture'),
  inputFileKey: varchar(255),
  foods: json, // Array de alimentos processados
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Análise:**
- ✅ **Boa estrutura:** Separação clara entre usuários e refeições
- ✅ **Flexibilidade:** Campo `foods` como JSON permite diferentes estruturas
- ✅ **Rastreabilidade:** Status tracking para processamento assíncrono
- ⚠️ **Melhoria:** Adicionar índices para `userId` e `status` para performance
- ⚠️ **Melhoria:** Considerar normalizar `foods` em tabela separada para consultas complexas

---

## 🔐 Autenticação e Segurança

### JWT (`src/lib/jwt.ts`)
```typescript
// Gera token de acesso válido por 7 dias
signAccessTokenFor(userId: string) → string

// Verifica e extrai userId do token
verifyAccessToken(token: string) → string | null
```

**Análise:**
- ✅ **Simplicidade:** Implementação direta e funcional
- ✅ **Segurança:** Tokens com expiração
- ⚠️ **Melhoria:** Implementar refresh tokens
- ⚠️ **Melhoria:** Adicionar blacklist para logout
- ⚠️ **Melhoria:** Usar variáveis de ambiente para configurações

### Criptografia (`bcryptjs`)
- Senhas hasheadas com salt rounds = 8
- Comparação segura com `compare()`

---

## 🧮 Cálculo de Metas Nutricionais

### `src/lib/calculateGoals.ts`

**Fórmula utilizada:**
1. **BMR (Basal Metabolic Rate):**
   - Homens: `88.36 + 13.4 × peso + 4.8 × altura - 5.7 × idade`
   - Mulheres: `447.6 + 9.2 × peso + 3.1 × altura - 4.3 × idade`

2. **TDEE (Total Daily Energy Expenditure):**
   - `BMR × Multiplicador de Atividade`

3. **Metas baseadas no objetivo:**
   - Manter: TDEE
   - Ganhar: TDEE + 500 cal
   - Perder: TDEE - 500 cal

4. **Distribuição de Macronutrientes:**
   - Proteínas: `peso × 2g`
   - Gorduras: `peso × 0.9g`
   - Carboidratos: `(calorias - proteínas×4 - gorduras×9) ÷ 4`

**Análise:**
- ✅ **Cientificamente válida:** Fórmulas baseadas em estudos
- ✅ **Flexível:** Suporta diferentes objetivos e níveis de atividade
- ⚠️ **Melhoria:** Adicionar validação de entrada
- ⚠️ **Melhoria:** Considerar fatores individuais (composição corporal, etc.)

---

## 🎯 Controllers

### 1. SignUpController (`src/controllers/signUpController.ts`)

**Funcionalidade:** Cadastro de usuário com cálculo automático de metas

**Fluxo:**
1. Valida dados com Zod
2. Verifica se email já existe
3. Calcula metas nutricionais
4. Hash da senha
5. Insere usuário no banco
6. Gera JWT
7. Retorna dados do usuário + token

**Análise:**
- ✅ **Validação robusta:** Zod schema completo
- ✅ **Segurança:** Senha hasheada
- ✅ **UX:** Retorna token automaticamente
- ⚠️ **Melhoria:** Adicionar validação de força da senha
- ⚠️ **Melhoria:** Implementar verificação de email

### 2. SignInController (`src/controllers/signInController.ts`)

**Funcionalidade:** Autenticação de usuário

**Fluxo:**
1. Valida email/senha
2. Busca usuário no banco
3. Compara senha com bcrypt
4. Gera JWT
5. Retorna dados + token

**Análise:**
- ✅ **Segurança:** Mensagem genérica para credenciais inválidas
- ✅ **Performance:** Busca otimizada apenas campos necessários
- ⚠️ **Melhoria:** Implementar rate limiting
- ⚠️ **Melhoria:** Adicionar logs de tentativas de login

### 3. MeController (`src/controllers/meController.ts`)

**Funcionalidade:** Retorna dados do usuário logado

**Fluxo:**
1. Usa userId do JWT (já validado)
2. Busca dados do usuário
3. Retorna informações nutricionais

**Análise:**
- ✅ **Simplicidade:** Endpoint direto
- ✅ **Segurança:** Usa ProtectedHttpRequest
- ⚠️ **Melhoria:** Adicionar cache para dados estáticos

### 4. CreateMealController (`src/controllers/createMealController.ts`)

**Funcionalidade:** Inicia processo de criação de refeição

**Fluxo:**
1. Valida tipo de arquivo (áudio/foto)
2. Gera UUID para arquivo
3. Cria presigned URL do S3 (10 min)
4. Insere refeição com status 'uploading'
5. Retorna mealId + uploadUrl

**Análise:**
- ✅ **Segurança:** Presigned URLs com expiração
- ✅ **Flexibilidade:** Suporta áudio e imagem
- ⚠️ **Melhoria:** Validar tamanho máximo de arquivo
- ⚠️ **Melhoria:** Implementar limpeza de refeições órfãs

### 5. ListMealsController (`src/controllers/listMealsController.ts`)

**Funcionalidade:** Lista refeições por data

**Fluxo:**
1. Valida parâmetro de data
2. Busca refeições do usuário na data
3. Filtra apenas refeições com status 'success'

**Análise:**
- ✅ **Performance:** Query otimizada com índices
- ✅ **Segurança:** Filtra por userId
- ⚠️ **Melhoria:** Adicionar paginação
- ⚠️ **Melhoria:** Implementar cache

### 6. GetMealByIdController (`src/controllers/getMealByIdContoller.ts`)

**Funcionalidade:** Busca refeição específica

**Fluxo:**
1. Valida mealId (UUID)
2. Busca refeição do usuário
3. Retorna dados completos

**Análise:**
- ✅ **Segurança:** Validação de UUID
- ✅ **Isolamento:** Usuário só vê suas refeições
- ⚠️ **Melhoria:** Adicionar cache para refeições acessadas frequentemente

---

## 🔄 Funções Lambda

### Estrutura Padrão
Todas as funções seguem o padrão:
```typescript
1. Parse event (comum/protegido)
2. Chama controller
3. Parse response
4. Trata erros de autenticação
```

### Funções Públicas
- `signIn`: Login
- `signUp`: Cadastro

### Funções Protegidas
- `me`: Dados do usuário
- `createMeal`: Criar refeição
- `listMeals`: Listar refeições
- `getMealById`: Buscar refeição

### Funções de Sistema
- `fileUploadedEvent`: Trigger S3 → SQS
- `processMeal`: Processa mensagens SQS

**Análise:**
- ✅ **Consistência:** Padrão uniforme em todas as funções
- ✅ **Separação:** Lógica de negócio nos controllers
- ✅ **Tratamento de erro:** Try/catch para autenticação
- ⚠️ **Melhoria:** Implementar logging estruturado
- ⚠️ **Melhoria:** Adicionar métricas de performance

---

## 📁 Utilitários

### Parse Event (`src/utils/parseEvent.ts`)
```typescript
// Converte APIGatewayProxyEventV2 em HttpRequest
{
  body: JSON.parse(event.body),
  params: event.pathParameters,
  queryParams: event.queryStringParameters
}
```

### Parse Protected Event (`src/utils/parseProtectedEvent.ts`)
```typescript
// Adiciona validação de JWT ao parseEvent
// Extrai userId do token
// Lança erro se token inválido
```

### HTTP Responses (`src/utils/http.ts`)
```typescript
ok(200), created(201), badRequest(400), 
conflict(409), unauthorized(401)
```

**Análise:**
- ✅ **Reutilização:** Utilitários centralizados
- ✅ **Tipagem:** TypeScript bem estruturado
- ⚠️ **Melhoria:** Adicionar mais códigos de status (404, 500, etc.)

---

## 🗂️ Clientes AWS

### S3 Client (`src/clients/s3Clients.ts`)
```typescript
// Cliente padrão do AWS SDK v3
// Usa credenciais do ambiente
```

### SQS Client (`src/clients/sqsClient.ts`)
```typescript
// Cliente padrão do AWS SDK v3
// Para envio de mensagens de processamento
```

**Análise:**
- ✅ **Simplicidade:** Configuração padrão adequada
- ⚠️ **Melhoria:** Adicionar retry policies
- ⚠️ **Melhoria:** Configurar timeouts específicos

---

## 🔄 Processamento Assíncrono

### Fluxo de Processamento
```
1. Usuário faz upload → S3
2. S3 Event → Lambda fileUploadedEvent
3. Lambda envia mensagem → SQS
4. Lambda processMeal processa mensagem
5. Atualiza status da refeição
```

### ProcessMeal (`src/queues/ProcessMeal.ts`)

**Funcionalidade:** Processa refeições em background

**Fluxo:**
1. Busca refeição pelo fileKey
2. Verifica se já foi processada
3. Atualiza status para 'processing'
4. Chama IA (placeholder)
5. Atualiza com dados processados
6. Em caso de erro, marca como 'failed'

**Análise:**
- ✅ **Resiliência:** Tratamento de erro adequado
- ✅ **Idempotência:** Evita reprocessamento
- ⚠️ **Melhoria:** Implementar IA real
- ⚠️ **Melhoria:** Adicionar retry com backoff
- ⚠️ **Melhoria:** Implementar dead letter queue

---

## 🚀 Serverless Configuration

### `serverless.yml`

**Recursos AWS:**
- **S3 Bucket:** `foodiary-uploads-jstack-lab-giacomo`
- **SQS Queue:** `foodiary-meals-queue-jstack-lab-giacomo`
- **DLQ:** `foodiary-meals-dlq-jstack-lab-giacomo`

**IAM Permissions:**
- S3: PutObject
- SQS: SendMessage

**Análise:**
- ✅ **Segurança:** Permissões mínimas necessárias
- ✅ **Organização:** Nomes descritivos
- ✅ **Resiliência:** Dead letter queue configurada
- ⚠️ **Melhoria:** Adicionar tags para organização
- ⚠️ **Melhoria:** Configurar lifecycle do S3

---

## 📈 Pontos Fortes do Projeto

1. **Arquitetura bem estruturada:** Separação clara de responsabilidades
2. **Segurança:** JWT, bcrypt, validação com Zod
3. **Escalabilidade:** Serverless + processamento assíncrono
4. **Type Safety:** TypeScript em todo o projeto
5. **Padrões consistentes:** Estrutura uniforme nas funções
6. **Flexibilidade:** Suporte a áudio e imagem
7. **Cálculos nutricionais:** Baseados em fórmulas científicas

---

## 🔧 Melhorias Sugeridas

### Prioridade Alta
1. **Implementar IA real** para processamento de alimentos
2. **Adicionar validação de entrada** mais robusta
3. **Implementar logging** estruturado
4. **Adicionar testes** unitários e de integração
5. **Configurar monitoramento** (CloudWatch, X-Ray)

### Prioridade Média
1. **Implementar cache** para dados frequentemente acessados
2. **Adicionar paginação** nas listagens
3. **Implementar rate limiting**
4. **Adicionar refresh tokens**
5. **Configurar CI/CD** automatizado

### Prioridade Baixa
1. **Adicionar documentação** OpenAPI/Swagger
2. **Implementar versionamento** de API
3. **Adicionar métricas** de negócio
4. **Otimizar queries** com índices
5. **Implementar backup** automático

---

## 🎯 Conclusão

O projeto **Foodiary API** demonstra uma arquitetura serverless bem estruturada com:

- **Boas práticas** de desenvolvimento
- **Segurança** adequada
- **Escalabilidade** nativa
- **Manutenibilidade** através de código limpo

A base está sólida para evolução e adição de novas funcionalidades. O foco atual deve ser na implementação da IA para processamento de alimentos e na adição de testes automatizados.
