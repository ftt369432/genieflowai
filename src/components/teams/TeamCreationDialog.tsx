import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Users, Upload, X, Plus, Info } from 'lucide-react';
import { useTeam } from '../../contexts/TeamContext';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface TeamCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamCreationDialog({ isOpen, onClose }: TeamCreationDialogProps) {
  const { user } = useAuth();
  const { createTeam } = useTeam();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    avatar: '/logos/default-team.png',
  });
  const [initialMembers, setInitialMembers] = useState<{ email: string; role: 'admin' | 'member' | 'guest' }[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'admin' | 'member' | 'guest'>('member');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
        // In a real app, you would upload this to a storage service
        // and get back a URL to save in teamData.avatar
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1 && !teamData.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const addMember = () => {
    if (!memberEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    
    if (initialMembers.some(m => m.email === memberEmail.trim())) {
      toast.error("This email is already added");
      return;
    }
    
    setInitialMembers([...initialMembers, {
      email: memberEmail.trim(),
      role: memberRole
    }]);
    setMemberEmail('');
  };

  const removeMember = (email: string) => {
    setInitialMembers(initialMembers.filter(m => m.email !== email));
  };

  const handleCreateTeam = async () => {
    if (!teamData.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setIsLoading(true);
    try {
      // Create the team first
      const newTeam = await createTeam({
        name: teamData.name,
        description: teamData.description,
        avatar: avatarPreview || teamData.avatar
      });
      
      // In a real app, you would handle inviting members here
      // For example, sending invitation emails to the initialMembers list
      
      toast.success("Team created successfully!");
      onClose();
      // Reset the form
      setTeamData({
        name: '',
        description: '',
        avatar: '/logos/default-team.png',
      });
      setInitialMembers([]);
      setStep(1);
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            {step === 1 ? 
              "Set up your team's basic information" : 
              "Invite team members to collaborate"}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center mb-4">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-2 border-dashed border-gray-300 group-hover:border-primary">
                  <AvatarImage src={avatarPreview || teamData.avatar} />
                  <AvatarFallback>
                    <Users className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Label htmlFor="avatar-upload" className="cursor-pointer p-2 bg-white rounded-full">
                    <Upload className="h-5 w-5" />
                  </Label>
                  <Input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name <span className="text-red-500">*</span></Label>
              <Input 
                id="team-name" 
                value={teamData.name} 
                onChange={(e) => setTeamData({...teamData, name: e.target.value})}
                placeholder="Engineering Team"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Textarea 
                id="team-description" 
                value={teamData.description} 
                onChange={(e) => setTeamData({...teamData, description: e.target.value})}
                placeholder="What does this team do?"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input 
                value={memberEmail} 
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1"
              />
              <select 
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as 'admin' | 'member' | 'guest')}
                className="border rounded-md p-2"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="guest">Guest</option>
              </select>
              <Button type="button" onClick={addMember} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5" />
              <p>Team members will receive an email invitation to join your team. As the creator, you'll automatically be added as an admin.</p>
            </div>
            
            {initialMembers.length > 0 && (
              <div className="border rounded-md">
                <div className="p-2 bg-muted font-medium text-sm">
                  Invitations ({initialMembers.length})
                </div>
                <div className="p-2">
                  {initialMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div>{member.email}</div>
                        <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeMember(member.email)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex sm:justify-between">
          {step === 1 ? (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                Next: Add Members
              </Button>
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleCreateTeam} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Team"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 