'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingCart, 
  Star, 
  ArrowLeft, 
  Package, 
  Shield, 
  Truck,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  inventory: number;
  featured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ProductPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products?search=${params.slug}`);
      const data = await response.json();
      const foundProduct = data.products?.find((p: Product) => p.slug === params.slug);
      
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        // Try fetching by ID if slug search fails
        const directResponse = await fetch(`/api/products/${params.slug}`);
        if (directResponse.ok) {
          const directData = await directResponse.json();
          setProduct(directData);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    if (!product) return;

    setIsAddingToCart(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      if (response.ok) {
        toast.success(`Added ${quantity} item(s) to cart!`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const discount = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const images = product.images.length > 0 
    ? product.images 
    : ['https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link href={`/?category=${product.category.slug}`} className="hover:text-indigo-600">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.featured && (
              <Badge className="absolute top-4 left-4 bg-yellow-500 hover:bg-yellow-600">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="absolute top-4 right-4">
                -{discount}%
              </Badge>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square relative bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-indigo-600' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category.name}
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.comparePrice && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.comparePrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Quantity Selector */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                  disabled={quantity >= product.inventory}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-600">
                {product.inventory} in stock
              </span>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !session || product.inventory === 0}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
            </Button>

            {!session && (
              <p className="text-sm text-gray-600 text-center">
                <Link href="/auth/signin" className="text-indigo-600 hover:underline">
                  Sign in
                </Link> to add items to cart
              </p>
            )}
          </div>

          <Separator />

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Truck className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Free Shipping</h4>
                <p className="text-sm text-gray-600">On orders over $100</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Secure Payment</h4>
                <p className="text-sm text-gray-600">SSL encrypted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Easy Returns</h4>
                <p className="text-sm text-gray-600">30-day policy</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}