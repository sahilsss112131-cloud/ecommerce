import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCartItemSchema } from '@/lib/validations/cart'
import { requireAuth } from '@/lib/middleware/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const userId = authResult.sub as string
    const body = await request.json()
    const { quantity } = updateCartItemSchema.parse(body)

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: params.itemId,
        cart: { userId }
      },
      include: {
        product: true
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    if (quantity === 0) {
      // Remove item from cart
      await prisma.cartItem.delete({
        where: { id: params.itemId }
      })
    } else {
      // Verify inventory
      if (cartItem.product.inventory < quantity) {
        return NextResponse.json(
          { error: 'Insufficient inventory' },
          { status: 400 }
        )
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: params.itemId },
        data: { quantity }
      })
    }

    return NextResponse.json({ message: 'Cart updated successfully' })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const userId = authResult.sub as string

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: params.itemId,
        cart: { userId }
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    await prisma.cartItem.delete({
      where: { id: params.itemId }
    })

    return NextResponse.json({ message: 'Item removed from cart' })

  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}