import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { updateTeamMemberSchedule, type TeamMember } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

interface WorkScheduleEditorProps {
  teamId: number;
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function WorkScheduleEditor({ teamId, member, isOpen, onClose, onUpdated }: WorkScheduleEditorProps) {
  const [scheduleType, setScheduleType] = useState<'FullTime' | 'PartTime' | 'Custom'>('FullTime');
  const [customHours, setCustomHours] = useState<number>(40);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (member && isOpen) {
      // Užkrauname esamus nario duomenis, kai atidaromas modalas
      const type = (member.scheduleType as 'FullTime' | 'PartTime' | 'Custom') || 'FullTime';
      setScheduleType(type);
      setCustomHours(member.weeklyHours || 40);
    }
  }, [member, isOpen]);

  const handleSave = async () => {
    if (!member) return;
    
    // Validacija: jei Custom, valandos turi būti tarp 1 ir 80
    let hoursToSave = customHours;
    if (scheduleType === 'FullTime') hoursToSave = 40;
    if (scheduleType === 'PartTime') hoursToSave = 20;

    if (scheduleType === 'Custom' && (hoursToSave < 1 || hoursToSave > 80)) {
      toast({ variant: 'error', title: 'Invalid hours', description: 'Hours must be between 1 and 80.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateTeamMemberSchedule(teamId, member.id, {
        scheduleType,
        weeklyHours: hoursToSave
      });
      toast({ variant: 'success', title: 'Success', description: 'Work schedule updated successfully.' });
      onUpdated(); // Atnaujiname sąrašą tėviniame komponente
      onClose();
    } catch (error) {
      toast({ variant: 'error', title: 'Error', description: error instanceof Error ? error.message : 'Failed to update schedule.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Work Schedule - {member.userName}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <RadioGroup 
            value={scheduleType} 
            onValueChange={(val: 'FullTime' | 'PartTime' | 'Custom') => setScheduleType(val)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-zinc-50 cursor-pointer" onClick={() => setScheduleType('FullTime')}>
              <RadioGroupItem value="FullTime" id="r1" />
              <Label htmlFor="r1" className="cursor-pointer flex-1">Full-time (40 hours/week)</Label>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-zinc-50 cursor-pointer" onClick={() => setScheduleType('PartTime')}>
              <RadioGroupItem value="PartTime" id="r2" />
              <Label htmlFor="r2" className="cursor-pointer flex-1">Part-time (20 hours/week)</Label>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-zinc-50 cursor-pointer" onClick={() => setScheduleType('Custom')}>
              <RadioGroupItem value="Custom" id="r3" />
              <Label htmlFor="r3" className="cursor-pointer flex-1">Custom hours</Label>
            </div>
          </RadioGroup>

          {scheduleType === 'Custom' && (
            <div className="pl-8 space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="hours">Weekly Hours</Label>
              <Input 
                id="hours" 
                type="number" 
                min={1} 
                max={80} 
                value={customHours} 
                onChange={(e) => setCustomHours(Number(e.target.value))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">Enter hours between 1 and 80.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}