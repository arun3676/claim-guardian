import './globals.css';

export const metadata = {
  title: 'ClaimGuardian AI - Medical Billing Analysis',
  description: 'AI-powered medical billing analysis platform helping patients fight unfair medical bills',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-xl font-semibold text-medical-primary">ClaimGuardian AI</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
