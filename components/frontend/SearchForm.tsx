type SearchFormProps = {
  className?: string
  placeholder?: string
  defaultValue?: string
  actionPath?: string
  variant?: 'dreamy' | 'angelic'
}

export function SearchForm({
  className = '',
  placeholder = 'Cauta vise, articole sau simboluri',
  defaultValue = '',
  actionPath = '/cauta',
  variant = 'dreamy',
}: SearchFormProps) {
  const dreamy = variant === 'dreamy'

  return (
    <form action={actionPath} className={className}>
      <label className="sr-only" htmlFor="site-search">
        Cauta in site
      </label>
      <div
        className={
          dreamy
            ? 'flex items-center gap-2 rounded-full border border-[#d8cfec] bg-white/88 px-3 py-2 shadow-[0_12px_30px_rgba(88,59,136,0.08)] backdrop-blur'
            : 'flex items-center gap-2 rounded-full border border-[#efd2a2] bg-white px-3 py-2 shadow-sm'
        }
      >
        <input
          id="site-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={
            dreamy
              ? 'w-full bg-transparent text-sm text-[#2f2050] outline-none placeholder:text-[#8a7aa9]'
              : 'w-full bg-transparent text-sm text-[#5b3411] outline-none placeholder:text-[#b17b31]'
          }
        />
        <button
          type="submit"
          className={
            dreamy
              ? 'rounded-full bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7c4ff0]'
              : 'rounded-full bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90'
          }
        >
          Cauta
        </button>
      </div>
    </form>
  )
}
