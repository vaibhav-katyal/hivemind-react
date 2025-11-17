import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { saveProject, getUsers } from '@/lib/api';
import { X, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const CreateProject = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const fetchUsers = async () => {
      try {
        const users = await getUsers();
        setAvailableUsers(users.filter(u => u.id !== user.id));
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user, navigate]);

  if (!user || loading) return null;

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddMember = (userId) => {
    if (!teamMembers.find(tm => tm.userId === userId)) {
      setTeamMembers([...teamMembers, { userId, role: 'Member' }]);
    }
    setOpen(false);
  };

  const handleRemoveMember = (userId) => {
    setTeamMembers(teamMembers.filter(tm => tm.userId !== userId));
  };

  const handleUpdateRole = (userId, role) => {
    setTeamMembers(teamMembers.map(tm => 
      tm.userId === userId ? { ...tm, role } : tm
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    try {
      const newProject = {
        name: name.trim(),
        description: description.trim(),
        githubLink: githubLink.trim(),
        leaderId: user.id,
        teamMembers: [{ userId: user.id, role: 'Lead' }, ...teamMembers],
        status: 'planning',
        progress: 0,
        createdDate: new Date().toISOString(),
        completedDate: null,
        tags,
        isPublic: true,
        likes: 0,
        comments: [],
        contributionRequests: [],
      };

      const createdProject = await saveProject(newProject);
      toast({
        title: "Success!",
        description: "Project created successfully",
      });
      navigate(`/project/${createdProject.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Make sure the server is running.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUsers = teamMembers.map(tm => availableUsers.find(u => u.id === tm.userId)).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project"
                  rows={4}
                />
              </div>

              {/* GitHub Link */}
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Repository</Label>
                <Input
                  id="github"
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/..."
                  type="url"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Team Members */}
              <div className="space-y-2">
                <Label>Team Members</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Search className="h-4 w-4 mr-2" />
                      Add team member
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search HiveMind users..." />
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {availableUsers
                          .filter(u => !teamMembers.find(tm => tm.userId === u.id))
                          .map((user) => (
                            <CommandItem
                              key={user.id}
                              onSelect={() => handleAddMember(user.id)}
                            >
                              {user.name} ({user.email})
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedUsers.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {selectedUsers.map((member) => {
                      const teamMember = teamMembers.find(tm => tm.userId === member.id);
                      return (
                        <div key={member.id} className="flex items-center gap-2 p-3 border border-border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <Input
                            value={teamMember.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            placeholder="Role"
                            className="w-32"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1 bg-gradient-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/projects')} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProject;
