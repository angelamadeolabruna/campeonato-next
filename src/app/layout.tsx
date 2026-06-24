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
      <body>
        <DialogProvider>
          <AuthProvider>{children}</AuthProvider>
        </DialogProvider>
      </body>
    </html>
  )
}
