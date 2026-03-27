type SearchFormProps = {
  className?: string
  placeholder?: string
  defaultValue?: string
  actionPath?: string
}

export function SearchForm({ className = '', placeholder = 'Cauta vise, articole sau simboluri', defaultValue = '', actionPath = '/cauta' }: SearchFormProps) {
  return (
    <form action={actionPath} className={className}>
      <label className="sr-only" htmlFor="site-search">
        Cauta in site
      </label>
      <div className="flex items-center gap-2 rounded-full border border-[#d8cfec] bg-white px-3 py-2 shadow-sm">
        <input
          id="site-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-[#2f2050] outline-none placeholder:text-[#8a7aa9]"
        />
        <button type="submit" className="rounded-full bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7c4ff0]">
          Cauta
        </button>
      </div>
    </form>
  )
}