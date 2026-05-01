import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { useToast } from '@/components/ui/toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { addTeamMember } from '@/lib/api';
import type { OrganizationMember, TeamMember, AddTeamMemberRequest } from '@/lib/api';
import { required } from '@/lib/validation';
import { UserPlusIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  teamId: number;
  availableMembers: OrganizationMember[];
  currentMembers: TeamMember[];
  onAdded: () => void;
}

export function AddTeamMemberModal({ teamId, availableMembers, currentMembers, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { values, errors, setFieldValue, validateForm, resetForm } = useFormValidation(
    {
      selectedUserId: '',
      selectedRole: '1',
    },
    {
      selectedUserId: [required('Member')],
      selectedRole: [required('Role')],
    },
  );

  // Filter out members who are already in the team
  const currentMemberUserIds = currentMembers.map(m => m.userId);
  const eligibleMembers = availableMembers.filter(
    m => !currentMemberUserIds.includes(m.userId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'warning',
        title: t('validation.fieldRequired'),
      });
      return;
    }
    
    // Find the selected member to get their orgMemberId
    const selectedMember = eligibleMembers.find(m => m.userId.toString() === values.selectedUserId);
    if (!selectedMember) {
      toast({
        variant: 'warning',
        title: t('validation.fieldRequired'),
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const requestData: AddTeamMemberRequest = {
        orgMemberId: selectedMember.id,
        role: Number(values.selectedRole), // Convert string to enum integer
      };
      
      await addTeamMember(teamId, requestData);
      toast({
        variant: 'success',
        title: t('common.success'),
        description: t('teams.failedCreate')
      });
      setOpen(false);
      resetForm({ selectedUserId: '', selectedRole: '1' });
      onAdded();
    } catch (error) {
      toast({
        variant: 'error',
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('teams.failedCreate')
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
          resetForm({ selectedUserId: '', selectedRole: '1' });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon className="h-4 w-4 mr-2" />
          {t('teams.addMember')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('teams.addMemberTitle')}</DialogTitle>
          <DialogDescription>
            Add a member from your organization to this team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="member" className="text-sm font-medium block mb-2">
              Select Member <span className="text-destructive">*</span>
            </label>
            {eligibleMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                All organization members are already in this team.
              </p>
            ) : (
              <select 
                id="member"
                value={values.selectedUserId}
                onChange={(e) => setFieldValue('selectedUserId', e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 aria-invalid:border-destructive"
                required
                aria-invalid={!!errors.selectedUserId}
                aria-describedby={errors.selectedUserId ? 'add-team-member-user-error' : undefined}
              >
                <option value="">Select a member</option>
                {eligibleMembers.map((member) => (
                  <option key={member.userId} value={member.userId.toString()}>
                    {member.email}
                  </option>
                ))}
              </select>
            )}
            <FieldError id="add-team-member-user-error" message={errors.selectedUserId} />
          </div>
          <div>
            <label htmlFor="role" className="text-sm font-medium block mb-2">
              {t('organizations.role')} <span className="text-destructive">*</span>
            </label>
            <select 
              id="role"
              value={values.selectedRole}
              onChange={(e) => setFieldValue('selectedRole', e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 aria-invalid:border-destructive"
              aria-invalid={!!errors.selectedRole}
              aria-describedby={errors.selectedRole ? 'add-team-member-role-error' : undefined}
            >
              <option value="1">Member</option>
              <option value="0">Admin</option>
            </select>
            <FieldError id="add-team-member-role-error" message={errors.selectedRole} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || eligibleMembers.length === 0}
            >
              {isLoading ? t('common.creating') : t('teams.addMember')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
