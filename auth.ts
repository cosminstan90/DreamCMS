// Fail fast if NEXTAUTH_SECRET is missing or still the placeholder value
const _secret = process.env.NEXTAUTH_SECRET
if (!_secret || _secret === 'generate-with-openssl-rand-hex-32' || _secret.length < 32) {
  throw new Error(
    '[DreamCMS] NEXTAUTH_SECRET is missing or using the placeholder value.\n' +
    'Generate a real secret with:  openssl rand -hex 32'
  )
}

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { Role } from "@prisma/client"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { sanitizeCallbackUrl } from "@/lib/security/request"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        if (!user) return null
        
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string, 
          user.passwordHash
        )
        if (!isPasswordValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as Role
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${sanitizeCallbackUrl(url, '/admin/dashboard')}`
      return `${baseUrl}/admin/dashboard`
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
})
