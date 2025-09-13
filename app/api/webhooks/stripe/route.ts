import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment status
        await prisma.payment.update({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'COMPLETED' }
        })

        // Update order status
        const payment = await prisma.payment.findUnique({
          where: { stripePaymentId: paymentIntent.id },
          include: { order: { include: { items: true } } }
        })

        if (payment) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'PROCESSING' }
          })

          // Reduce product inventory
          for (const item of payment.order.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                inventory: { decrement: item.quantity }
              }
            })
          }

          // Clear user's cart
          const userId = payment.order.userId
          await prisma.cartItem.deleteMany({
            where: { cart: { userId } }
          })
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        
        await prisma.payment.update({
          where: { stripePaymentId: failedPayment.id },
          data: { status: 'FAILED' }
        })
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}