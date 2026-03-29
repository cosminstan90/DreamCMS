import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email și parola sunt obligatorii.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email as string },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email sau parolă invalidă.' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(
      password as string,
      user.passwordHash
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email sau parolă invalidă.' },
        { status: 401 }
      )
    }

    // Build the JWT payload matching what NextAuth expects
    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        id: user.id,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      salt: 'next-auth.session-token',
    })

    // Determine cookie options
    const isSecure = process.env.NODE_ENV === 'production'

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[login] Error:', error)
    return NextResponse.json(
      { error: 'Eroare internă la autentificare.' },
      { status: 500 }
    )
  }
}
