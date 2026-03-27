import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { logAdminAudit } from '@/lib/security/audit'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { name, role, slug, headline, bio, credentials, methodology, expertise, avatarUrl, trustStatement, publicProfile } = await req.json()

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        role,
        slug: typeof slug === 'string' ? generateSlug(slug) : name ? generateSlug(name) : undefined,
        headline,
        bio,
        credentials,
        methodology,
        expertise,
        avatarUrl,
        trustStatement,
        publicProfile: typeof publicProfile === 'boolean' ? publicProfile : undefined,
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
      action: 'USER_UPDATE',
      entityType: 'user',
      entityId: user.id,
      meta: { email: user.email, role: user.role },
    })

    revalidatePath('/admin')
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (session.user.id === params.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id: params.id } })
    await logAdminAudit({
      req,
      session,
      action: 'USER_DELETE',
      entityType: 'user',
      entityId: params.id,
    })
    revalidatePath('/admin')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
