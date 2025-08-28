import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import schemaSql from '@/../supabase/schema.sql?raw'
import seedSql from '@/../supabase/seed.sql?raw'

export const Route = createFileRoute('/setup')({
  component: SetupPage
})

function copy(text: string) {
  navigator.clipboard.writeText(text)
}

function SetupPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-2xl font-bold text-wendys-charcoal">Project Setup</h1>
      <ol className="list-decimal ml-5 space-y-4 text-gray-700">
        <li>
          Supabase → Auth → Providers → Email: enable. Then Auth → Users → Add user (auto-confirm).
        </li>
        <li>
          Supabase → SQL Editor: paste the schema SQL, run it. Then paste the seed SQL, run it.
        </li>
        <li>
          In <code>.env.local</code> set URL, ANON KEY, set <code>VITE_USE_MOCK_DATA=false</code>, restart dev server.
        </li>
      </ol>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-wendys-charcoal">Schema SQL</h2>
          <Button onClick={() => copy(schemaSql)} className="wendys-button">Copy</Button>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-80 text-xs">
{schemaSql}
        </pre>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-wendys-charcoal">Seed SQL</h2>
          <Button onClick={() => copy(seedSql)} className="wendys-button">Copy</Button>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-80 text-xs">
{seedSql}
        </pre>
      </section>
    </div>
  )
}

export default SetupPage


