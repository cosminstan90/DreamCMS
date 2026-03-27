import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  prisma.redirect.update({
    where: { id: params.id },
    data: { hits: { increment: 1 } },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
