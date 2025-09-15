"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { Category } from '@prisma/client'
import { FormDataType } from '@/type'
import { createProduct, readCategories } from '../actions'
import ProductImage from '../components/ProductImage'
import { FileImage } from 'lucide-react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

const NewProductPage = () => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    unit: "",
    imageUrl: ""
  })

  // --- Charge les catégories au montage ---
  useEffect(() => {
    if (!email) return
    const fetchCategories = async () => {
      try {
        const data = await readCategories(email)
        if (data) setCategories(data)
      } catch (err) {
        console.error(err)
        toast.error("Erreur lors du chargement des catégories")
      }
    }
    fetchCategories()
  }, [email])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : null)
  }

  const handleSubmit = async () => {
    if (!email) return toast.error("Utilisateur non authentifié")
    if (!formData.name || !formData.description || !formData.price || !formData.categoryId || !formData.unit)
      return toast.error("Veuillez remplir tous les champs")
    if (!file) return toast.error("Veuillez sélectionner une image")

    try {
      const imageData = new FormData()
      imageData.append("file", file)

      const res = await fetch("/api/upload", { method: "POST", body: imageData })
      const data = await res.json()
      if (!data.success) throw new Error("Erreur lors de l'upload de l'image")

      await createProduct({ ...formData, imageUrl: data.path }, email)

      toast.success("Produit créé avec succès")
      router.push("/new-product")
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de la création du produit")
    }
  }

  if (!email) return <div>Chargement...</div>

  return (
    <Wrapper>
      <div className="flex justify-center items-start py-6">
        <div className="space-y-4 md:w-[450px]">
          <h1 className="text-2xl font-bold mb-4">Créer un produit</h1>

          <input type="text" name="name" placeholder="Nom" className="input input-bordered w-full" value={formData.name} onChange={handleChange} />
          <textarea name="description" placeholder="Description" className="textarea textarea-bordered w-full" value={formData.description} onChange={handleChange} />
          <input type="number" name="price" placeholder="Prix" className="input input-bordered w-full" value={formData.price} onChange={handleChange} />

          <select className="select select-bordered w-full" value={formData.categoryId} name="categoryId" onChange={handleChange}>
            <option value="">Sélectionner une catégorie</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <select className="select select-bordered w-full" name="unit" value={formData.unit} onChange={handleChange}>
            <option value="">Sélectionnez une unité</option>
            <option value="sacs">Sac</option>
            <option value="kg">Kilogramme</option>
            <option value="l">Litre</option>
            <option value="m">Mètre</option>
            <option value="cm">Centimètre</option>
            <option value="bts">Boite</option>
            <option value="pcs">Pièces</option>
            <option value="schts">Sachet</option>
            <option value="bts">Bouteille</option>
            <option value="cas">Casier</option>
          </select>

          <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={handleFileChange} />

          <button onClick={handleSubmit} className="btn btn-primary w-full">Créer le produit</button>

          <div className="mt-4 md:w-[300px] md:h-[300px] border-2 border-primary p-5 flex justify-center items-center rounded-3xl">
            {previewUrl ? <ProductImage src={previewUrl} alt="preview" widthClass="w-40" heightClass="h-40" /> : <FileImage strokeWidth={1} className="h-10 w-10 text-primary" />}
          </div>
        </div>
      </div>
    </Wrapper>
  )
}

export default NewProductPage
