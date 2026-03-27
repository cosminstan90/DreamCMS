import Link from 'next/link'

type AuthorTrustCardProps = {
  name?: string | null
  slug?: string | null
  headline?: string | null
  bio?: string | null
  credentials?: string | null
  methodology?: string | null
  expertise?: string[]
  trustStatement?: string | null
}

export function AuthorTrustCard({ name, slug, headline, bio, credentials, methodology, expertise = [], trustStatement }: AuthorTrustCardProps) {
  if (!name) return null

  return (
    <section className="mt-10 rounded-3xl border border-[#e5daf5] bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[#7b67a5]">Autor & metodologie</div>
          <h2 className="mt-2 text-2xl font-semibold text-[#2f2050]">{name}</h2>
          {headline && <p className="mt-2 text-sm text-[#5f4b80]">{headline}</p>}
        </div>
        {slug && (
          <Link href={`/autor/${slug}`} className="rounded-full border border-[#d9ccf1] bg-[#f8f4ff] px-4 py-2 text-sm font-medium text-[#4f35a1]">
            Vezi profilul autorului
          </Link>
        )}
      </div>

      {credentials && (
        <div className="mt-5 rounded-2xl border border-[#ece2fb] bg-[#faf7ff] p-4 text-sm text-[#4e3b74]">
          <span className="font-semibold text-[#2f2050]">Experienta relevanta:</span> {credentials}
        </div>
      )}

      {bio && <p className="mt-5 text-sm leading-7 text-[#5f4b80]">{bio}</p>}

      {expertise.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {expertise.map((item) => (
            <span key={item} className="rounded-full border border-[#ddd1f7] bg-white px-3 py-1 text-xs text-[#5f4b80]">
              {item}
            </span>
          ))}
        </div>
      )}

      {(methodology || trustStatement) && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {methodology && (
            <div className="rounded-2xl border border-[#ece2fb] bg-[#fcfbff] p-4">
              <div className="text-xs uppercase tracking-wide text-[#7b67a5]">Metodologie</div>
              <p className="mt-2 text-sm leading-7 text-[#5f4b80]">{methodology}</p>
            </div>
          )}
          {trustStatement && (
            <div className="rounded-2xl border border-[#ece2fb] bg-[#fcfbff] p-4">
              <div className="text-xs uppercase tracking-wide text-[#7b67a5]">Trust note</div>
              <p className="mt-2 text-sm leading-7 text-[#5f4b80]">{trustStatement}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
