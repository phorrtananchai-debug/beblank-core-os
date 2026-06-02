export const ServicesPage = () => (
  <section className="mx-auto min-h-screen max-w-screen-2xl px-5 pb-32 pt-40 md:px-8">
    <p className="public-project-meta text-[#777777]">services</p>
    <h1 className="mt-6 max-w-5xl text-6xl font-extrabold uppercase leading-[0.86] md:text-8xl">
      Studio systems for work, space, and operations.
    </h1>
    <div className="mt-20 grid gap-8 border-t border-black/[0.08] pt-8 md:grid-cols-3">
      {['studio direction', 'operating systems', 'editorial workspace'].map((item) => (
        <article key={item}>
          <p className="public-project-title">{item}</p>
          <p className="mt-4 text-sm leading-7 text-[#666666]">
            A quiet placeholder surface for the approved Be Blank service language.
          </p>
        </article>
      ))}
    </div>
  </section>
)
