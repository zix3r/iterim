import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { addTeamMember } from '@/lib/api';
import type { OrganizationMember, TeamMember, AddTeamMemberRequest } from '@/lib/api';
import { UserPlusIcon } from 'lucide-react';

interface Props {
  teamId: number;
  availableMembers: OrganizationMember[];
  currentMembers: TeamMember[];
  onAdded: () => void;
}

export function AddTeamMemberModal({ teamId, availableMembers, currentMembers, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('1'); // Default to Member (1)
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Filter out members who are already in the team
  const currentMemberUserIds = currentMembers.map(m => m.userId);
  const eligibleMembers = availableMembers.filter(
    m => !currentMemberUserIds.includes(m.userId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    // Find the selected member to get their orgMemberId
    const selectedMember = eligibleMembers.find(m => m.userId.toString() === selectedUserId);
    if (!selectedMember) return;
    
    setIsLoading(true);
    try {
      const requestData: AddTeamMemberRequest = {
        orgMemberId: selectedMember.id,
        role: Number(selectedRole), // Convert string to enum integer
      };
      
      await addTeamMember(teamId, requestData);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team member added successfully'
      });
      setOpen(false);
      setSelectedUserId('');
      setSelectedRole('1'); // Reset to Member
      onAdded();
    } catch (error) {
      console.error('Failed to add team member', error);
      toast({
        variant: 'error',
        title: 'Error',
        description: 'Failed to add team member. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a member from your organization to this team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="member" className="text-sm font-medium block mb-2">Select Member</label>
            {eligibleMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                All organization members are already in this team.
              </p>
            ) : (
              <select 
                id="member"
                value={selectedUserId} 
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                required
              >
                <option value="">Select a member</option>
                {eligibleMembers.map((member) => (
                  <option key={member.userId} value={member.userId.toString()}>
                    {member.email}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="role" className="text-sm font-medium block mb-2">Role</label>
            <select 
              id="role"
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="1">Member</option>
              <option value="0">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !selectedUserId || eligibleMembers.length === 0}
            >
              {isLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
