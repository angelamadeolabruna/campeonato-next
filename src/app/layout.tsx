import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { DialogProvider } from '@/components/ConfirmDialog'

export const metadata = {
  title: 'Campeonato de Fútbol - Administración',
  description: 'Sistema de administración de campeonato de fútbol mixto',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DialogProvider>
          <AuthProvider>{children}</AuthProvider>
        </DialogProvider>
      </body>
    </html>
  )
}
