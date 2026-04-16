import * as React from "react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastProps = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
}

type ToastContextType = {
  toasts: ToastProps[]
  toast: (props: Omit<ToastProps, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback((props: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = props.duration || 3000
    
    setToasts((prev) => [...prev, { ...props, id }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

function Toast({ toast, onDismiss }: { toast: ToastProps; onDismiss: () => void }) {
  const variantStyles = {
    default: "bg-background border",
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-500 text-amber-950",
  }

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-lg p-4 shadow-lg transition-all animate-in slide-in-from-right",
        variantStyles[toast.variant || "default"]
      )}
    >
      <div className="flex-1">
        {toast.title && <div className="font-semibold">{toast.title}</div>}
        {toast.description && (
          <div className="text-sm opacity-90">{toast.description}</div>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
