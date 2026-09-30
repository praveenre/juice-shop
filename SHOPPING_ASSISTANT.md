# Shopping assistant

Open `/#/shopping-assistant` or use **Shopping assistant** in the top bar.
The original training chatbot remains at its existing route and retains its intentional vulnerabilities.

The assistant answers shop guideline questions (delivery, returns, payment, coupons, ingredients, order tracking, privacy) locally from a built-in knowledge base. For product questions it prefers an LLM when configured and otherwise searches the product catalog with a local keyword engine.

## Optional: free LLM via OpenRouter

Store the following in the ignored `.env.key` file (the key can be a free OpenRouter account key):

```dotenv
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
# optional, defaults to the free Qwen model:
SHOPPING_ASSISTANT_MODEL=qwen/qwen3.8-27b:free
```

## Start locally

Use Node 24. Build, then start with the key file:

```powershell
npm run build
$env:PORT='3001'
node --env-file=.env.key build/app.js
```

The assistant also works without a key using the local engine. Free models are rate-limited upstream; when the provider throttles or fails, the server automatically falls back to the local catalog search, so questions are always answered.

Do not put the key in frontend code or Docker build arguments. `.env*` files are excluded from Docker build context.

## Data boundary

The shopping assistant queries the product database to get the current product catalog. Guideline answers are generated entirely on the server. With an API key configured, product questions send only the product list and the user's question to OpenRouter; cookies, authorization headers, chat history, and customer records are never included. Questions are not saved by this feature. Users must not type confidential information into the question field.

LLM output is limited to up to 3 product IDs via strict structured output. The server validates those IDs against the catalog and returns only product name, description, price, and image. Model prose, fabricated IDs, extra fields, and provider errors cannot become answers. There are no model tools or write actions. A 20-second provider timeout, 1000-character input limit, and per-IP limit of 10 requests per minute bound usage. `store: false` is sent to the provider; note that free-tier models may still be used for training by the provider unless you opt out in your OpenRouter privacy settings.

These boundaries apply to the new assistant, not to the deliberately vulnerable Juice Shop application as a whole.
