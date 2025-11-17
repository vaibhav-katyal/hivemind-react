import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getPublicProjects, saveProject, getUserById } from '@/lib/localStorage';
import { Heart, MessageCircle, Search, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [comment, setComment] = useState('');
  const [contributionMessage, setContributionMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProjects();
  }, [user, navigate]);

  const loadProjects = () => {
    const publicProjects = getPublicProjects();
    setProjects(publicProjects);
  };

  if (!user) return null;

  const handleLike = (project) => {
    const hasLiked = project.likes.includes(user.id);
    const updatedProject = {
      ...project,
      likes: hasLiked 
        ? project.likes.filter(id => id !== user.id)
        : [...project.likes, user.id]
    };
    saveProject(updatedProject);
    loadProjects();
    toast({
      title: hasLiked ? "Like removed" : "Liked!",
      description: hasLiked ? "Project removed from your likes" : "You liked this project",
    });
  };

  const handleComment = (project) => {
    if (!comment.trim()) return;

    const updatedProject = {
      ...project,
      comments: [
        ...project.comments,
        {
          id: Date.now().toString(),
          userId: user.id,
          content: comment.trim(),
          createdDate: new Date().toISOString(),
        }
      ]
    };
    saveProject(updatedProject);
    setComment('');
    loadProjects();
    toast({
      title: "Comment added",
      description: "Your comment has been posted",
    });
  };

  const handleRequestContribution = (project) => {
    if (!contributionMessage.trim()) return;

    const updatedProject = {
      ...project,
      contributionRequests: [
        ...project.contributionRequests,
        {
          id: Date.now().toString(),
          userId: user.id,
          message: contributionMessage.trim(),
          status: 'pending',
          createdDate: new Date().toISOString(),
        }
      ]
    };
    saveProject(updatedProject);
    setContributionMessage('');
    setSelectedProject(null);
    loadProjects();
    toast({
      title: "Request sent!",
      description: "The project leader will review your request",
    });
  };

  const filteredProjects = searchQuery
    ? projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : projects;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold">Community Projects</h1>
            <p className="text-muted-foreground mt-2">
              Discover projects, connect with teams, and collaborate
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No projects found' : 'No public projects yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => {
                const leader = getUserById(project.leaderId);
                const hasLiked = project.likes.includes(user.id);
                const hasRequested = project.contributionRequests.some(
                  req => req.userId === user.id
                );
                const isTeamMember = project.leaderId === user.id || 
                  project.teamMembers.some(tm => tm.userId === user.id);

                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 space-y-4">
                      {/* Header */}
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold">{project.name}</h3>
                          <Badge className={
                            project.status === 'completed' ? 'bg-success/10 text-success' :
                            project.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                            'bg-muted text-muted-foreground'
                          }>
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">{tag}</Badge>
                        ))}
                      </div>

                      {/* Leader Info */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {leader?.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{leader?.name}</p>
                          <p className="text-xs text-muted-foreground">Project Leader</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleLike(project)}
                        >
                          <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current text-destructive' : ''}`} />
                          {project.likes.length}
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <MessageCircle className="h-4 w-4" />
                              {project.comments.length}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{project.name}</DialogTitle>
                              <DialogDescription>Comments and discussions</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {project.comments.map((comment) => {
                                const commenter = getUserById(comment.userId);
                                return (
                                  <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                        {commenter?.name.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{commenter?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(comment.createdDate).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <p className="text-sm mt-1">{comment.content}</p>
                                    </div>
                                  </div>
                                );
                              })}
                              {project.comments.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">
                                  No comments yet. Be the first!
                                </p>
                              )}
                              <div className="space-y-2 pt-4 border-t">
                                <Textarea
                                  placeholder="Add a comment..."
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  rows={3}
                                />
                                <Button 
                                  onClick={() => handleComment(project)}
                                  className="w-full"
                                >
                                  Post Comment
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {!isTeamMember && (
                          <Dialog open={selectedProject?.id === project.id} onOpenChange={(open) => !open && setSelectedProject(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 ml-auto"
                                disabled={hasRequested}
                                onClick={() => setSelectedProject(project)}
                              >
                                <UserPlus className="h-4 w-4" />
                                {hasRequested ? 'Requested' : 'Request to Join'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request to Contribute</DialogTitle>
                                <DialogDescription>
                                  Send a message to the project leader explaining why you'd like to join
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Tell them why you want to contribute..."
                                  value={contributionMessage}
                                  onChange={(e) => setContributionMessage(e.target.value)}
                                  rows={4}
                                />
                                <Button
                                  onClick={() => handleRequestContribution(project)}
                                  className="w-full"
                                  disabled={!contributionMessage.trim()}
                                >
                                  Send Request
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;
