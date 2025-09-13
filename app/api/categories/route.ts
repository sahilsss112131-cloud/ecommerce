import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCategorySchema } from '@/lib/validations/category'
import { requireAdmin } from '@/lib/middleware/auth'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const { name, description, image } = createCategorySchema.parse(body)

    // Generate unique slug
    const baseSlug = generateSlug(name)
    const existingCategories = await prisma.category.findMany({
      select: { slug: true }
    })
    const slug = generateUniqueSlug(baseSlug, existingCategories.map(c => c.slug))

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image,
        slug,
      }
    })

    return NextResponse.json(category, { status: 201 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}