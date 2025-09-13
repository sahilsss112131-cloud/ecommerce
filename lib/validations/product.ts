import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().optional(),
  sku: z.string().min(1, 'SKU is required'),
  inventory: z.number().int().min(0, 'Inventory must be non-negative'),
  images: z.array(z.string().url()).optional().default([]),
  categoryId: z.string().min(1, 'Category is required'),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>