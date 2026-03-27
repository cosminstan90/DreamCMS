import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { logAdminAudit } from '@/lib/security/audit'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      slug: true,
      headline: true,
      bio: true,
      credentials: true,
      methodology: true,
      expertise: true,
      avatarUrl: true,
      trustStatement: true,
      publicProfile: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { email, name, password, role } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const baseSlug = generateSlug(name || email.split('@')[0])
    const user = await prisma.user.create({
      data: {
        email,
        name,
        slug: baseSlug || undefined,
        passwordHash,
        role: role || 'EDITOR',
      },
      select: {
        id: true,
        email: true,
        name: true,
        slug: true,
        headline: true,
        bio: true,
        credentials: true,
        methodology: true,
        expertise: true,
        avatarUrl: true,
        trustStatement: true,
        publicProfile: true,
        role: true,
      },
    })

    await logAdminAudit({
      req,
      session,
      action: 'USER_CREATE',
      entityType: 'user',
      entityId: user.id,
      meta: { email: user.email, role: user.role },
    })

    revalidatePath('/admin')
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
