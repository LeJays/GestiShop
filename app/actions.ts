"use server"

import prisma from "./lib/prisma"
import { FormDataType, OrderItem, ProductOverviewStats, StockSummary, Transaction } from "@/type"
import { Category } from "@prisma/client"

// ---------- ASSOCIATIONS ----------
export async function checkAndAddAssociation(email: string, name: string) {
  if (!email || !name) return
  try {
    const existing = await prisma.association.findUnique({ where: { email } })
    if (!existing) await prisma.association.create({ data: { email, name } })
  } catch (error) {
    console.error(error)
  }
}

export async function getAssociation(email: string) {
  if (!email) return null
  try {
    return await prisma.association.findUnique({ where: { email } })
  } catch (error) {
    console.error(error)
    return null
  }
}

// ---------- CATEGORIES ----------
export async function createCategory(name: string, email: string, description?: string) {
  if (!name || !email) return
  try {
    const association = await getAssociation(email)
    if (!association) throw new Error("Aucune boutique trouvée.")
    await prisma.category.create({ data: { name, description: description || "", associationId: association.id } })
  } catch (error) {
    console.error(error)
  }
}

export async function updateCategory(id: string, email: string, name: string, description?: string) {
  if (!id || !email || !name) return
  try {
    const association = await getAssociation(email)
    if (!association) throw new Error("Aucune association trouvée.")
    await prisma.category.update({
      where: { id },
      data: { name, description: description || "" }
    })
  } catch (error) {
    console.error(error)
  }
}

export async function deleteCategory(id: string, email: string) {
  if (!id || !email) return
  try {
    const association = await getAssociation(email)
    if (!association) throw new Error("Aucune association trouvée.")
    await prisma.category.delete({ where: { id } })
  } catch (error) {
    console.error(error)
  }
}

export async function readCategories(email: string): Promise<Category[]> {
  if (!email) throw new Error("Email requis.")
  const association = await getAssociation(email)
  if (!association) return []
  return await prisma.category.findMany({ where: { associationId: association.id } })
}

// ---------- PRODUITS ----------
export async function createProduct(formData: FormDataType, email: string) {
  if (!formData.name || !formData.price || !formData.categoryId || !email) return
  const association = await getAssociation(email)
  if (!association) throw new Error("Aucune association trouvée.")
  await prisma.product.create({
    data: {
      name: formData.name,
      description: formData.description || "",
      price: Number(formData.price),
      imageUrl: formData.imageUrl || "",
      unit: formData.unit || "",
      categoryId: formData.categoryId,
      associationId: association.id
    }
  })
}

export async function updateProduct(formData: FormDataType, email: string) {
  if (!formData.id || !formData.name || !formData.price || !email) return
  const association = await getAssociation(email)
  if (!association) throw new Error("Aucune association trouvée.")
  await prisma.product.update({
    where: { id: formData.id },
    data: {
      name: formData.name,
      description: formData.description || "",
      price: Number(formData.price),
      imageUrl: formData.imageUrl || ""
    }
  })
}

export async function deleteProduct(id: string, email: string) {
  if (!id || !email) return
  const association = await getAssociation(email)
  if (!association) throw new Error("Aucune association trouvée.")
  await prisma.product.delete({ where: { id } })
}

export async function readProducts(email: string) {
  if (!email) return []
  const association = await getAssociation(email)
  if (!association) return []
  const products = await prisma.product.findMany({
    where: { associationId: association.id },
    include: { category: true }
  })
  return products.map(p => ({ ...p, categoryName: p.category?.name }))
}

export async function readProductById(productId: string, email: string) {
  if (!productId || !email) return null
  const association = await getAssociation(email)
  if (!association) return null
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true }
  })
  if (!product) return null
  return { ...product, categoryName: product.category?.name }
}

// ---------- TRANSACTIONS ET STOCK ----------
export async function replenishStockWithTransaction(productId: string, quantity: number, email: string) {
  if (!email || quantity <= 0) return
  const association = await getAssociation(email)
  if (!association) throw new Error("Aucune association trouvée.")
  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { quantity: { increment: quantity } }
    }),
    prisma.transaction.create({
      data: { type: "IN", quantity, productId, associationId: association.id }
    })
  ])
}

// actions.ts
export async function deductStockWithTransaction(orderItems: OrderItem[], email: string): Promise<{ success: boolean; message: string }> {
    try {
        if (!email) {
            return { success: false, message: "L'email est requis." }
        }

        const association = await getAssociation(email)
        if (!association) {
            return { success: false, message: "Aucune association trouvée avec cet email." }
        }

        // Vérification de stock avant transaction
        for (const item of orderItems) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } })
            if (!product) return { success: false, message: `Produit avec l'ID ${item.productId} introuvable.` }
            if (item.quantity <= 0) return { success: false, message: `Quantité invalide pour "${product.name}".` }
            if (product.quantity < item.quantity) return { success: false, message: `Stock insuffisant pour "${product.name}". Demandé: ${item.quantity}, Disponible: ${product.quantity}.` }
        }

        // Début transaction
        await prisma.$transaction(async (tx) => {
            for (const item of orderItems) {
                await tx.product.update({
                    where: { id: item.productId, associationId: association.id },
                    data: { quantity: { decrement: item.quantity } }
                })
                await tx.transaction.create({
                    data: {
                        type: "OUT",
                        quantity: item.quantity,
                        productId: item.productId,
                        associationId: association.id
                    }
                })
            }
        })

        return { success: true, message: "Sortie confirmée avec succès !" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Une erreur est survenue lors de la sortie." }
    }
}


// ---------- STATISTIQUES ----------
export async function getProductOverviewStats(email: string): Promise<ProductOverviewStats> {
  const association = await getAssociation(email)
  if (!association) return { totalProducts: 0, totalCategories: 0, totalTransactions: 0, stockValue: 0 }

  const products = await prisma.product.findMany({ where: { associationId: association.id }, include: { category: true } })
  const transactions = await prisma.transaction.findMany({ where: { associationId: association.id } })

  const categoriesSet = new Set(products.map(p => p.category.name))
  const stockValue = products.reduce((acc, p) => acc + p.price * p.quantity, 0)

  return {
    totalProducts: products.length,
    totalCategories: categoriesSet.size,
    totalTransactions: transactions.length,
    stockValue
  }
}

export async function getProductCategoryDistribution(email: string) {
  const association = await getAssociation(email)
  if (!association) return []

  const categoriesWithProducts = await prisma.category.findMany({
    where: { associationId: association.id },
    include: { products: { select: { id: true } } }
  })

  return categoriesWithProducts.map(c => ({ name: c.name, value: c.products.length }))
}

export async function getStockSummary(email: string): Promise<StockSummary> {
  const association = await getAssociation(email)
  if (!association) return { inStockCount: 0, lowStockCount: 0, outOfStockCount: 0, criticalProducts: [] }

  const products = await prisma.product.findMany({ where: { associationId: association.id }, include: { category: true } })
  const inStock = products.filter(p => p.quantity > 5)
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 5)
  const outOfStock = products.filter(p => p.quantity === 0)

  return {
    inStockCount: inStock.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    criticalProducts: [...lowStock, ...outOfStock].map(p => ({ ...p, categoryName: p.category.name }))
  }
}

// ---------- TRANSACTIONS ----------
export async function getTransactions(email: string, limit?: number): Promise<Transaction[]> {
  const association = await getAssociation(email)
  if (!association) return []

  const transactions = await prisma.transaction.findMany({
    where: { associationId: association.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { product: { include: { category: true } } }
  })

  return transactions.map(tx => ({
    ...tx,
    productName: tx.product.name,
    categoryName: tx.product.category.name,
    imageUrl: tx.product.imageUrl,
    price: tx.product.price,
    unit: tx.product.unit
  }))
}
