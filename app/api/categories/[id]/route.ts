import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCategorySchema } from '@/lib/validations/category'
import { requireAdmin } from '@/lib/middleware/auth'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        products: {
          where: { published: true },
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            slug: true,
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)

  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const data = updateCategorySchema.parse(body)

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Generate new slug if name changed
    let updateData: any = { ...data }
    if (data.name && data.name !== existingCategory.name) {
      const baseSlug = generateSlug(data.name)
      const existingCategories = await prisma.category.findMany({
        where: { id: { not: params.id } },
        select: { slug: true }
      })
      updateData.slug = generateUniqueSlug(baseSlug, existingCategories.map(c => c.slug))
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(category)

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: params.id }
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })

  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}