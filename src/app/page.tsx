export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary-600 sm:text-6xl">
          Welcome to Pauv
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Your application is ready. Configure your Supabase credentials to get
          started.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="#"
            className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            Get started
          </a>
          <a href="#" className="text-sm font-semibold leading-6 text-gray-900">
            Learn more <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </main>
  );
}
