import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addToCartSchema } from '@/lib/validations/cart'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const userId = authResult.sub as string

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                slug: true,
                inventory: true
              }
            }
          }
        }
      }
    })

    if (!cart) {
      return NextResponse.json({
        id: null,
        items: [],
        total: 0,
        itemCount: 0
      })
    }

    const total = cart.items.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    )
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      ...cart,
      total,
      itemCount
    })

  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const userId = authResult.sub as string
    const body = await request.json()
    const { productId, quantity } = addToCartSchema.parse(body)

    // Verify product exists and has sufficient inventory
    const product = await prisma.product.findUnique({
      where: { id: productId, published: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.inventory < quantity) {
      return NextResponse.json(
        { error: 'Insufficient inventory' },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      })
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    })

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity

      if (product.inventory < newQuantity) {
        return NextResponse.json(
          { error: 'Insufficient inventory' },
          { status: 400 }
        )
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        }
      })
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                slug: true,
                inventory: true
              }
            }
          }
        }
      }
    })

    const total = updatedCart!.items.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    )
    const itemCount = updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      ...updatedCart,
      total,
      itemCount
    })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    )
  }
}