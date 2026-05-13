import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/LanguageContext';

interface AddRetroCardFormProps {
  onSubmit: (content: string) => Promise<void>;
}

/**
 * Inline "+" button that expands into a small textarea + Save form.
 * Auto-collapses on success or cancel.
 */
export function AddRetroCardForm({ onSubmit }: AddRetroCardFormProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center border-dashed text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-3 w-3" />
        {t('retro.addCard')}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed bg-background p-2 space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('retro.contentPlaceholder')}
        rows={3}
        maxLength={2000}
        autoFocus
        className="text-sm"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => {
            setOpen(false);
            setContent('');
          }}
          disabled={submitting}
        >
          <X className="mr-1 h-3 w-3" />
          {t('common.cancel')}
        </Button>
        <Button
          size="sm"
          className="h-7 px-2"
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
        >
          {submitting ? t('common.saving') : t('common.add')}
        </Button>
      </div>
    </div>
  );
}
