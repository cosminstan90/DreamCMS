export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics (ro -> ascii)
    .replace(/\s+/g, "-") // space to dash
    .replace(/[^\w-]+/g, "") // remove non-alphanumeric except dashes
    .replace(/--+/g, "-") // replace multiple dashes with single
    .replace(/^-+/, "") // remove leading dashes
    .replace(/-+$/, "") // remove trailing dashes
}
