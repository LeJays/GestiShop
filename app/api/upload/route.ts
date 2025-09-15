import { existsSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "Aucun fichier fourni." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = file.name.split(".").pop();
    const uniqueName = crypto.randomUUID() + "." + ext;
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const publicPath = `/uploads/${uniqueName}`;
    return NextResponse.json({ success: true, path: publicPath }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erreur lors de l'upload." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ success: false, message: "Chemin invalide." }, { status: 400 });
    }

    const filePath = join(process.cwd(), "public", path);

    if (!existsSync(filePath)) {
      return NextResponse.json({ success: false, message: "Fichier non trouvé." }, { status: 404 });
    }

    await unlink(filePath);
    return NextResponse.json({ success: true, message: "Fichier supprimé avec succès." }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression." }, { status: 500 });
  }
}
