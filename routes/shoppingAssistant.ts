/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response } from 'express'
import { z } from 'zod'
import logger from '../lib/logger'
import { assistantReply, fetchProducts, selectShoppingAnswers, type AssistantReply, type ProductAnswer } from '../lib/shoppingAssistant'

const inputSchema = z.object({ message: z.string().trim().min(1).max(1000) }).strict()

export function shoppingAssistant (
  reply: (message: string, products: ProductAnswer[]) => AssistantReply = assistantReply,
  getProducts = fetchProducts,
  selectLlm: typeof selectShoppingAnswers | null = selectShoppingAnswers,
  getKey = () => process.env.OPENROUTER_API_KEY
) {
  return async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store')
    const input = inputSchema.safeParse(req.body)
    if (!input.success) return res.status(400).json({ error: 'Enter a question between 1 and 1000 characters.' })
    try {
      const products = await getProducts()
      const apiKey = getKey()
      if (apiKey && selectLlm) {
        const model = process.env.SHOPPING_ASSISTANT_MODEL ?? 'qwen/qwen3.8-27b:free'
        try {
          const answers = await selectLlm(input.data.message, apiKey, products)
          if (answers.length > 0) {
            logger.info(`Shopping assistant: OpenRouter model ${model} selected ${answers.length} product(s)`)
            return res.json({ message: 'Here are some products that may match your question.', answers })
          }
          logger.info(`Shopping assistant: OpenRouter model ${model} selected no products, answering locally`)
        } catch (error) {
          logger.warn(`Shopping assistant: OpenRouter model ${model} unavailable (${error instanceof Error ? error.message : 'unknown error'}), answering locally`)
        }
      }
      return res.json(reply(input.data.message, products))
    } catch {
      return res.status(502).json({ error: 'The shopping assistant is temporarily unavailable. Please try again later.' })
    }
  }
}
