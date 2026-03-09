import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ title = "Klaida", message }: { title?: string, message: string }) {
  return (
    <div className="rounded-xl bg-red-50 p-4 border border-red-200 flex items-start gap-3 shadow-sm">
      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
      <div>
        <h3 className="text-sm font-semibold text-red-800">{title}</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
      </div>
    </div>
  );
}