'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'

type ConfirmConfig = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
}

type AlertConfig = {
  title?: string
  message: string
}

type DialogContextType = {
  confirm: (config: ConfirmConfig) => void
  alert: (config: AlertConfig) => void
}

const DialogContext = createContext<DialogContextType>({} as any)

export function useDialog() {
  return useContext(DialogContext)
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmConfig | null>(null)
  const [alertState, setAlertState] = useState<AlertConfig | null>(null)

  const confirm = useCallback((config: ConfirmConfig) => setConfirmState(config), [])
  const alertDialog = useCallback((config: AlertConfig) => setAlertState(config), [])

  return (
    <DialogContext.Provider value={{ confirm, alert: alertDialog }}>
      {children}

      {/* Confirm Dialog */}
      {confirmState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle size={22} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{confirmState.title || 'Confirmar'}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { confirmState.onCancel?.(); setConfirmState(null) }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                {confirmState.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={() => { confirmState.onConfirm(); setConfirmState(null) }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1.5"
              >
                <Check size={14} /> {confirmState.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      {alertState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{alertState.title || 'Aviso'}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">{alertState.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setAlertState(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1.5"
              >
                <X size={14} /> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}
