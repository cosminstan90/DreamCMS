import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { mergeAdsConfig } from '@/lib/ads/config'
import { logAdminAudit } from '@/lib/security/audit'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

const AI_FLAG = '# block-ai:true'

function parseBlockAi(robotsTxt: string | null | undefined) {
  return String(robotsTxt || '').toLowerCase().includes(AI_FLAG)
}

function mergeRobots(robotsTxt: string | null | undefined, blockAiBots: boolean) {
  const lines = String(robotsTxt || '')
    .split(/\r?\n/)
    .filter((line) => line.trim() && line.trim().toLowerCase() !== AI_FLAG)

  if (blockAiBots) lines.push(AI_FLAG)
  return lines.join('\n')
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const settings = context.seoSettings || await prisma.seoSettings.findUnique({ where: { siteId: context.site.id } })
  if (!settings) return NextResponse.json({ error: 'Settings missing' }, { status: 404 })

  return NextResponse.json({
    ...settings,
    blockAiBots: parseBlockAi(settings.robotsTxt),
    adsConfig: mergeAdsConfig(settings.adsConfig),
    enableAutoInternalLinks: Boolean(settings.enableAutoInternalLinks),
  })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const body = await req.json()
  const existing = context.seoSettings || await prisma.seoSettings.findUnique({ where: { siteId: context.site.id } })
  if (!existing) return NextResponse.json({ error: 'Settings missing' }, { status: 404 })

  const nextRobots = mergeRobots(body.robotsTxt ?? existing.robotsTxt, Boolean(body.blockAiBots))

  const updated = await prisma.seoSettings.update({
    where: { id: existing.id },
    data: {
      siteName: body.siteName ?? existing.siteName,
      siteUrl: body.siteUrl ?? existing.siteUrl,
      defaultMetaTitle: body.defaultMetaTitle ?? existing.defaultMetaTitle,
      defaultMetaDesc: body.defaultMetaDesc ?? existing.defaultMetaDesc,
      defaultOgImage: body.defaultOgImage ?? existing.defaultOgImage,
      adsConfig: mergeAdsConfig(body.adsConfig ?? existing.adsConfig),
      robotsTxt: nextRobots,
      googleVerification: body.googleVerification ?? existing.googleVerification,
      notifyEmail: body.notifyEmail ?? existing.notifyEmail,
      notifyOnBackup: typeof body.notifyOnBackup === 'boolean' ? body.notifyOnBackup : existing.notifyOnBackup,
      notifyOnErrors: typeof body.notifyOnErrors === 'boolean' ? body.notifyOnErrors : existing.notifyOnErrors,
      enableAutoInternalLinks: typeof body.enableAutoInternalLinks === 'boolean'
        ? body.enableAutoInternalLinks
        : existing.enableAutoInternalLinks,
    },
  })

  await logAdminAudit({
    req,
    session,
    action: 'SEO_SETTINGS_UPDATE',
    entityType: 'seoSettings',
    entityId: updated.id,
    meta: {
      siteId: context.site.id,
      blockAiBots: parseBlockAi(updated.robotsTxt),
      enableAutoInternalLinks: Boolean(updated.enableAutoInternalLinks),
    },
  })

  return NextResponse.json({
    ...updated,
    blockAiBots: parseBlockAi(updated.robotsTxt),
    adsConfig: mergeAdsConfig(updated.adsConfig),
    enableAutoInternalLinks: Boolean(updated.enableAutoInternalLinks),
  })
}

