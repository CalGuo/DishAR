import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold">AR Table Menu</span>
        <span className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Get started
          </Link>
        </span>
      </nav>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-16 text-center">
        <p className="text-sm font-medium text-zinc-500">
          3D-scan your dishes · customers see them in true-to-scale AR
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
          Put your menu on the table,
          <br className="hidden md:block" /> life-size in the room.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-zinc-600">
          Restaurants upload 3D-scanned dish models. Guests scan the table QR
          code and view any dish at real-world scale in AR — right in their
          phone browser, no app to install.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Create your free menu
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium hover:bg-zinc-50"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Upload",
              body: "Add a name, price, and a GLB scan of each dish. Optional USDZ for iOS quick look.",
            },
            {
              step: "2",
              title: "Print the QR",
              body: "Download one QR code per restaurant and put it at every table.",
            },
            {
              step: "3",
              title: "See it in AR",
              body: "Customers point their phone at the table and drop any dish on it — real size.",
            },
          ].map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
                {item.step}
              </span>
              <h3 className="mt-4 font-medium">{item.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-14">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-semibold">
            True-to-scale is the whole point.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-600">
            Every dish renders in its real measured dimensions, so guests know
            exactly what lands on the table. Try it with sample dishes in your
            dashboard — no 3D scanning software required to get started.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          >
            See it with sample dishes
          </Link>
        </div>
      </section>
    </main>
  );
}