import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { countInternalLinks } from '@/lib/seo/content-audit'
import { suggestInternalLinks } from '@/lib/seo/internal-linker'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const suggestions = await suggestInternalLinks({
      title: body.title,
      slug: body.slug,
      contentHtml: body.contentHtml,
      contentJson: body.contentJson,
      focusKeyword: body.focusKeyword,
      categoryId: body.categoryId,
      categorySlug: body.categorySlug,
      postType: body.postType,
      excludePostId: body.kind === 'post' ? body.id : null,
      excludeSymbolId: body.kind === 'symbol' ? body.id : null,
      limit: body.limit,
    })

    return NextResponse.json({
      suggestions,
      currentInternalLinks: countInternalLinks(body.contentHtml || ''),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 500 })
  }
}
