import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { existsSync, mkdir, writeFile } from "fs"
import crypto from "crypto"
import { createProduct } from "@/actions"

// Route POST : création d’un produit avec upload d’image
export async function POST(req: NextRequest) {
  try {
    const data = await req.formData()
    const file = data.get("file") as unknown as File
    const formDataStr = data.get("formData") as string
    const email = data.get("email") as string

    if (!email) return NextResponse.json({ success: false, message: "Utilisateur non authentifié." }, { status: 400 })
    if (!formDataStr) return NextResponse.json({ success: false, message: "Données du produit manquantes." }, { status: 400 })
    if (!file) return NextResponse.json({ success: false, message: "Fichier image manquant." }, { status: 400 })

    const formData = JSON.parse(formDataStr)

    // --- Upload image ---
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split(".").pop()
    const uniqueName = crypto.randomUUID() + "." + ext
    const filePath = join(uploadDir, uniqueName)
    await writeFile(filePath, buffer)

    const publicPath = `/uploads/${uniqueName}`

    // --- Création produit en base ---
    await createProduct({ ...formData, imageUrl: publicPath }, email)

    return NextResponse.json({ success: true, message: "Produit créé avec succès." }, { status: 200 })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ success: false, message: error.message || "Erreur serveur." }, { status: 500 })
  }
}