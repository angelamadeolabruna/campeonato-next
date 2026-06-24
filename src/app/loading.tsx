export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-amber-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm">Cargando...</p>
      </div>
    </div>
  )
}