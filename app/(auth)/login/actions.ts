'use server'

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { sanitizeCallbackUrl } from "@/lib/security/request"

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  const callbackUrl = sanitizeCallbackUrl(String(formData.get("callbackUrl") || "/admin/dashboard"))
  try {
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: callbackUrl
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Email sau parolă invalidă.'
        default:
          return 'Eroare necunoscută.'
      }
    }
    throw error
  }
}
