import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/security/auth'
import { normalizeHomepageSections } from '@/lib/sites/homepage'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function GET() {
  const { response: authResponse } = await requireRole('EDITOR')
  if (authResponse) return authResponse

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse || !context) {
    return siteResponse ?? NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })
  }

  return NextResponse.json({
    site: {
      id: context.site.id,
      name: context.site.name,
      slug: context.site.slug,
      templatePack: context.site.templatePack,
      themeKey: context.site.themeKey,
      homepageSections: context.site.homepageSections,
    },
    sitePack: {
      key: context.sitePack.key,
      displayName: context.sitePack.displayName,
      homepage: context.sitePack.homepage,
      features: context.sitePack.features,
    },
  })
}

export async function PUT(request: Request) {
  const { response: authResponse } = await requireRole('ADMIN')
  if (authResponse) return authResponse

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse || !context) {
    return siteResponse ?? NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })
  }

  const body = await request.json()
  const homepageSections = normalizeHomepageSections(body?.homepageSections, context.sitePack.homepage.sections)

  const site = await prisma.site.update({
    where: { id: context.site.id },
    data: { homepageSections },
  })

  return NextResponse.json({
    ok: true,
    site: {
      id: site.id,
      homepageSections,
    },
  })
}

