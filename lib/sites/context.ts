import { NextResponse } from 'next/server'
import { resolveCurrentSite } from '@/lib/sites/resolver'

export async function getRequiredCurrentSite() {
  const context = await resolveCurrentSite()
  if (!context.site.id) {
    throw new Error('Active site is not configured in the database.')
  }

  return {
    ...context,
    site: {
      ...context.site,
      id: context.site.id,
    },
  }
}

export async function requireCurrentSiteResponse(): Promise<
  | { context: Awaited<ReturnType<typeof getRequiredCurrentSite>>; response: undefined }
  | { context: null; response: NextResponse }
> {
  try {
    const context = await getRequiredCurrentSite()
    return { context, response: undefined }
  } catch {
    return {
      context: null,
      response: NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 }),
    }
  }
}
