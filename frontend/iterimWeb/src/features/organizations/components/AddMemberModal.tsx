import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { addOrganizationMember } from '@/lib/api';
import { email, required } from '@/lib/validation';
import { UserPlus } from 'lucide-react';

interface Props {
  organizationId: number;
  onMemberAdded: () => void;
}

export function AddMemberModal({ organizationId, onMemberAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation(
    {
      email: '',
      role: 'Member',
    },
    {
      email: [email('Email')],
      role: [required('Role')],
    },
  );

  const resetState = () => {
    resetForm({ email: '', role: 'Member' });
    setSubmitError(null);
  };

  const getMessageFromError = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'warning',
        title: 'Please fix validation errors',
      });
      return;
    }
    
    setIsLoading(true);
    setSubmitError(null);

    try {
      await addOrganizationMember(organizationId, values.email.trim(), values.role);

      toast({
        variant: 'success',
        title: 'Member invited successfully',
      });

      setOpen(false);
      resetState();
      onMemberAdded();
    } catch (error) {
      const errorMessage = getMessageFromError(error, 'Failed to add member');
      setSubmitError(errorMessage);
      toast({
        variant: 'error',
        title: 'Failed to add member',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Organization Member</DialogTitle>
          <DialogDescription>
            Invite a user to join this organization by entering their email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium block mb-2">
              Email <span className="text-destructive">*</span>
            </label>
            <Input 
              id="email"
              type="email"
              placeholder="user@example.com" 
              value={values.email}
              onChange={(e) => setFieldValue('email', e.target.value)}
              disabled={isLoading}
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'add-member-email-error' : undefined}
            />
            <FieldError id="add-member-email-error" message={errors.email} />
          </div>
          
          <div>
            <label htmlFor="role" className="text-sm font-medium block mb-2">
              Role <span className="text-destructive">*</span>
            </label>
            <select
              id="role"
              value={values.role}
              onChange={(e) => setFieldValue('role', e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 aria-invalid:border-destructive"
              required
              aria-invalid={!!errors.role}
              aria-describedby={errors.role ? 'add-member-role-error' : undefined}
            >
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="Viewer">Viewer</option>
            </select>
            <FieldError id="add-member-role-error" message={errors.role} />
          </div>

          {submitError && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
