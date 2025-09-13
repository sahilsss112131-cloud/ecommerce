import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
      role: 'CUSTOMER',
    },
  })

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Latest gadgets and electronic devices',
      slug: 'electronics',
      image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',
    },
  })

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      description: 'Fashion and apparel for all occasions',
      slug: 'clothing',
      image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg',
    },
  })

  const home = await prisma.category.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: {
      name: 'Home & Garden',
      description: 'Everything for your home and garden',
      slug: 'home-garden',
      image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
    },
  })

  // Create products
  const products = [
    {
      name: 'Wireless Bluetooth Headphones',
      description: 'Premium quality wireless headphones with noise cancellation and 30-hour battery life.',
      price: 199.99,
      comparePrice: 249.99,
      sku: 'WBH-001',
      inventory: 50,
      images: [
        'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
        'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'
      ],
      slug: 'wireless-bluetooth-headphones',
      featured: true,
      categoryId: electronics.id,
    },
    {
      name: 'Smart Watch Series X',
      description: 'Advanced fitness tracking, heart rate monitoring, and smartphone connectivity.',
      price: 299.99,
      comparePrice: 399.99,
      sku: 'SWX-001',
      inventory: 30,
      images: [
        'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
        'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg'
      ],
      slug: 'smart-watch-series-x',
      featured: true,
      categoryId: electronics.id,
    },
    {
      name: 'Premium Cotton T-Shirt',
      description: 'Soft, comfortable, and durable cotton t-shirt perfect for everyday wear.',
      price: 29.99,
      comparePrice: 39.99,
      sku: 'PCT-001',
      inventory: 100,
      images: [
        'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg',
        'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg'
      ],
      slug: 'premium-cotton-t-shirt',
      featured: false,
      categoryId: clothing.id,
    },
    {
      name: 'Designer Jeans',
      description: 'Stylish and comfortable designer jeans with perfect fit and premium denim.',
      price: 89.99,
      comparePrice: 120.00,
      sku: 'DJ-001',
      inventory: 75,
      images: [
        'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg',
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg'
      ],
      slug: 'designer-jeans',
      featured: true,
      categoryId: clothing.id,
    },
    {
      name: 'Ceramic Plant Pot Set',
      description: 'Beautiful set of 3 ceramic plant pots perfect for indoor plants and herbs.',
      price: 45.99,
      sku: 'CPP-001',
      inventory: 40,
      images: [
        'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
        'https://images.pexels.com/photos/1005058/pexels-photo-1005058.jpeg'
      ],
      slug: 'ceramic-plant-pot-set',
      featured: false,
      categoryId: home.id,
    },
    {
      name: 'LED Desk Lamp',
      description: 'Modern LED desk lamp with adjustable brightness and USB charging port.',
      price: 79.99,
      comparePrice: 99.99,
      sku: 'LDL-001',
      inventory: 25,
      images: [
        'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg',
        'https://images.pexels.com/photos/1112597/pexels-photo-1112597.jpeg'
      ],
      slug: 'led-desk-lamp',
      featured: true,
      categoryId: home.id,
    },
    {
      name: 'Wireless Phone Charger',
      description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
      price: 39.99,
      comparePrice: 59.99,
      sku: 'WPC-001',
      inventory: 60,
      images: [
        'https://images.pexels.com/photos/4526414/pexels-photo-4526414.jpeg',
        'https://images.pexels.com/photos/4526413/pexels-photo-4526413.jpeg'
      ],
      slug: 'wireless-phone-charger',
      featured: false,
      categoryId: electronics.id,
    },
    {
      name: 'Cozy Knit Sweater',
      description: 'Warm and comfortable knit sweater perfect for cold weather.',
      price: 69.99,
      sku: 'CKS-001',
      inventory: 45,
      images: [
        'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg',
        'https://images.pexels.com/photos/1656683/pexels-photo-1656683.jpeg'
      ],
      slug: 'cozy-knit-sweater',
      featured: false,
      categoryId: clothing.id,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })