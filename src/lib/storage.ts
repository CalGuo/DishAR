export const MENU_BUCKET = "menu-assets";

const ALLOWED_IMAGES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_MODELS = [
  "model/gltf-binary",
  "model/gltf+json",
  "model/vnd.usdz+zip",
  "application/octet-stream",
];

export function isValidImage(type: string): boolean {
  return ALLOWED_IMAGES.includes(type);
}

export function isValidModel(type: string): boolean {
  return ALLOWED_MODELS.includes(type);
}

export function extensionForFileName(name: string, type: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const allowed = ["glb", "gltf", "usdz", "png", "jpg", "jpeg", "webp"];
  if (ext && allowed.includes(ext)) return ext;

  switch (type) {
    case "model/gltf-binary":
    case "application/octet-stream":
      return "glb";
    case "model/gltf+json":
      return "gltf";
    case "model/vnd.usdz+zip":
      return "usdz";
    default:
      return "";
  }
}

export function objectPublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${MENU_BUCKET}/${path}`;
}