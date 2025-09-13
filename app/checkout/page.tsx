'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}

interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface CheckoutFormProps {
  cart: Cart;
  onSuccess: () => void;
}

function CheckoutForm({ cart, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  const [billingAddress, setBillingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create order and payment intent
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const { order, clientSecret } = await orderResponse.json();

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: sameAsShipping ? shippingAddress.name : billingAddress.name,
            email: shippingAddress.email,
            address: {
              line1: sameAsShipping ? shippingAddress.address : billingAddress.address,
              city: sameAsShipping ? shippingAddress.city : billingAddress.city,
              state: sameAsShipping ? shippingAddress.state : billingAddress.state,
              postal_code: sameAsShipping ? shippingAddress.zipCode : billingAddress.zipCode,
              country: sameAsShipping ? shippingAddress.country : billingAddress.country,
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success('Order placed successfully!');
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShippingChange = (field: string, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingChange = (field: string, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipping-name">Full Name</Label>
              <Input
                id="shipping-name"
                value={shippingAddress.name}
                onChange={(e) => handleShippingChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="shipping-email">Email</Label>
              <Input
                id="shipping-email"
                type="email"
                value={shippingAddress.email}
                onChange={(e) => handleShippingChange('email', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="shipping-address">Address</Label>
            <Input
              id="shipping-address"
              value={shippingAddress.address}
              onChange={(e) => handleShippingChange('address', e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="shipping-city">City</Label>
              <Input
                id="shipping-city"
                value={shippingAddress.city}
                onChange={(e) => handleShippingChange('city', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="shipping-state">State</Label>
              <Input
                id="shipping-state"
                value={shippingAddress.state}
                onChange={(e) => handleShippingChange('state', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="shipping-zip">ZIP Code</Label>
              <Input
                id="shipping-zip"
                value={shippingAddress.zipCode}
                onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-as-shipping"
              checked={sameAsShipping}
              onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
            />
            <Label htmlFor="same-as-shipping">Same as shipping address</Label>
          </div>
          
          {!sameAsShipping && (
            <>
              <div>
                <Label htmlFor="billing-name">Full Name</Label>
                <Input
                  id="billing-name"
                  value={billingAddress.name}
                  onChange={(e) => handleBillingChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="billing-address">Address</Label>
                <Input
                  id="billing-address"
                  value={billingAddress.address}
                  onChange={(e) => handleBillingChange('address', e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billing-city">City</Label>
                  <Input
                    id="billing-city"
                    value={billingAddress.city}
                    onChange={(e) => handleBillingChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billing-state">State</Label>
                  <Input
                    id="billing-state"
                    value={billingAddress.state}
                    onChange={(e) => handleBillingChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billing-zip">ZIP Code</Label>
                  <Input
                    id="billing-zip"
                    value={billingAddress.zipCode}
                    onChange={(e) => handleBillingChange('zipCode', e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
          <div className="flex items-center mt-4 text-sm text-gray-600">
            <Lock className="mr-2 h-4 w-4" />
            Your payment information is secure and encrypted
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {shipping === 0 ? (
                <Badge variant="secondary">Free</Badge>
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (session) {
      fetchCart();
    }
  }, [session, status, router]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        if (data.items.length === 0) {
          router.push('/cart');
          return;
        }
        setCart(data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/orders');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No items to checkout</h1>
        <Button asChild>
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">
          Complete your order securely
        </p>
      </div>

      <Elements stripe={stripePromise}>
        <CheckoutForm cart={cart} onSuccess={handleSuccess} />
      </Elements>
    </div>
  );
}