import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  getProjectById,
  saveProject,
  getTasksByProject,
  saveTask,
  getUsers,
  saveUser,
} from '@/lib/api';
import {
  ExternalLink,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  X,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    points: 10,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const fetchProjectData = async () => {
      try {
        if (!projectId) {
          navigate('/projects');
          return;
        }
        const proj = await getProjectById(projectId);
        if (!proj) {
          navigate('/projects');
          return;
        }
        // fetch users and build lookup map
        const users = await getUsers();
        const map = users.reduce((m, u) => ({ ...m, [u.id]: u }), {});
        setUsersMap(map);

        setProject(proj);
        const projectTasks = await getTasksByProject(projectId);
        setTasks(projectTasks);
      } catch (error) {
        console.error('Failed to fetch project:', error);
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [user, projectId, navigate]);

  if (loading || !project) return null;

  const loadTasks = async () => {
    if (projectId) {
      try {
        const projectTasks = await getTasksByProject(projectId);
        setTasks(projectTasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    }
  };

  const leader = project ? usersMap[project.leaderId] || null : null;
  const isLeader = project && project.leaderId === user.id;
  const isTeamMember = project && (project.teamMembers.some(tm => tm.userId === user.id) || isLeader);
  const teamMembers = project ? [
    { userId: project.leaderId, role: 'Project Leader' },
    ...project.teamMembers,
  ] : [];

  const handleCompleteTask = async (task) => {
    try {
      const updatedTask = {
        ...task,
        status: 'completed',
        completedDate: new Date().toISOString(),
      };
      await saveTask(updatedTask);

      // Award points to the user (use usersMap if available)
      const assignedUser = usersMap[task.assignedTo];
      if (assignedUser) {
        const updatedUser = {
          ...assignedUser,
          points: (assignedUser.points || 0) + task.points,
        };
        await saveUser(updatedUser);
      }

      // Update project progress
      const allTasks = await getTasksByProject(project.id);
      const completedCount = allTasks.filter(t => t.id === task.id || t.status === 'completed').length;
      const progress = Math.round((completedCount / allTasks.length) * 100);
      const updatedProject = { ...project, progress };
      await saveProject(updatedProject);
      setProject(updatedProject);

      await loadTasks();
      toast({
        title: "Task completed!",
        description: `${task.points} points awarded`,
      });
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    }
  };

  const handleRequestExtension = async (task, newDeadline, reason) => {
    try {
      const extensionRequest = {
        id: Date.now().toString(),
        requestedDate: new Date().toISOString(),
        newDeadline,
        reason,
        status: 'pending',
      };

      const updatedTask = {
        ...task,
        extensionRequests: [...task.extensionRequests, extensionRequest],
      };
      await saveTask(updatedTask);
      await loadTasks();
      toast({
        title: "Extension requested",
        description: "The project leader will review your request",
      });
    } catch (error) {
      console.error('Failed to request extension:', error);
      toast({
        title: "Error",
        description: "Failed to request extension",
        variant: "destructive",
      });
    }
  };

  const handleApproveRequest = async (requestId, type, taskId) => {
    try {
      if (type === 'contribution') {
        const request = project.contributionRequests.find(r => r.id === requestId);
        if (request) {
          const updatedProject = {
            ...project,
            contributionRequests: project.contributionRequests.map(r =>
              r.id === requestId ? { ...r, status: 'approved' } : r
            ),
            teamMembers: [...project.teamMembers, { userId: request.userId, role: 'Contributor' }],
          };
          await saveProject(updatedProject);
          setProject(updatedProject);
          toast({
            title: "Request approved",
            description: "User has been added to the team",
          });
        }
      } else if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const request = task.extensionRequests.find(r => r.id === requestId);
          if (request) {
            const updatedTask = {
              ...task,
              deadline: request.newDeadline,
              extensionRequests: task.extensionRequests.map(r =>
                r.id === requestId ? { ...r, status: 'approved' } : r
              ),
            };
            await saveTask(updatedTask);
            await loadTasks();
            toast({
              title: "Extension approved",
              description: "Task deadline has been updated",
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId, type, taskId) => {
    try {
      if (type === 'contribution') {
        const updatedProject = {
          ...project,
          contributionRequests: project.contributionRequests.map(r =>
            r.id === requestId ? { ...r, status: 'rejected' } : r
          ),
        };
        await saveProject(updatedProject);
        setProject(updatedProject);
        toast({
          title: "Request rejected",
        });
      } else if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const updatedTask = {
            ...task,
            extensionRequests: task.extensionRequests.map(r =>
              r.id === requestId ? { ...r, status: 'rejected' } : r
            ),
          };
          await saveTask(updatedTask);
          await loadTasks();
          toast({
            title: "Request rejected",
          });
        }
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.assignedTo) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const task = {
        projectId: project.id,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assignedTo: newTask.assignedTo,
        status: 'pending',
        deadline: newTask.deadline,
        createdDate: new Date().toISOString(),
        completedDate: null,
        points: newTask.points,
        extensionRequests: [],
      };

      await saveTask(task);
      setTaskDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        deadline: '',
        points: 10,
      });
      await loadTasks();
      toast({
        title: "Task created",
        description: "The task has been assigned successfully",
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const pendingContributions = project.contributionRequests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <Badge className={
                      project.status === 'completed' ? 'bg-success/10 text-success' :
                      project.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{teamMembers.length} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Created {new Date(project.createdDate).toLocaleDateString()}</span>
                    </div>
                    {project.githubLink && (
                      <a 
                        href={project.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    {project.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-3" />
                  </div>
                  {isLeader && (
                    <Button className="w-full" onClick={() => navigate(`/projects`)}>
                      Manage Project
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests (Leader Only) */}
          {isLeader && pendingContributions.length > 0 && (
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg">Pending Contribution Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingContributions.map((request) => {
                    const requester = usersMap[request.userId];
                    return (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {requester?.name ? requester.name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{requester?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{request.message}</p>
                            <Link 
                              to={`/profile/${request.userId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleApproveRequest(request.id, 'contribution')}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRejectRequest(request.id, 'contribution')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="tasks">
            <TabsList>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="team">Team ({teamMembers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tasks</CardTitle>
                  {isLeader && (
                    <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Assign Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Task</DialogTitle>
                          <DialogDescription>Assign a task to a team member</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="task-title">Title *</Label>
                            <Input
                              id="task-title"
                              value={newTask.title}
                              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                              placeholder="Task title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-desc">Description</Label>
                            <Textarea
                              id="task-desc"
                              value={newTask.description}
                              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                              placeholder="Task description"
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-assignee">Assign To *</Label>
                            <Select
                              value={newTask.assignedTo}
                              onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select team member" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers.map((member) => {
                                  const memberUser = usersMap[member.userId];
                                  return (
                                    <SelectItem key={member.userId} value={member.userId}>
                                      {memberUser?.name || 'Unknown'} ({member.role})
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-deadline">Deadline</Label>
                            <Input
                              id="task-deadline"
                              type="date"
                              value={newTask.deadline}
                              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-points">Points</Label>
                            <Input
                              id="task-points"
                              type="number"
                              min="1"
                              value={newTask.points}
                              onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) || 10 })}
                            />
                          </div>
                          <Button onClick={handleCreateTask} className="w-full">
                            Create Task
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tasks yet</p>
                      {isLeader && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Create your first task to get started
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasks.map((task) => {
                        const assignee = usersMap[task.assignedTo];
                        const isAssignedToMe = task.assignedTo === user.id;
                        const pendingExtensions = task.extensionRequests.filter(r => r.status === 'pending');
                        
                        return (
                          <div key={task.id} className="border border-border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{task.title}</h3>
                                  <Badge className={
                                    task.status === 'completed' ? 'bg-success/10 text-success' :
                                    task.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                                    'bg-muted text-muted-foreground'
                                  }>
                                    {task.status}
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span>Assigned to: {assignee?.name}</span>
                                  {task.deadline && (
                                    <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                                  )}
                                  <span className="text-accent font-medium">{task.points} points</span>
                                </div>
                              </div>
                              {isAssignedToMe && task.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteTask(task)}
                                  className="gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Complete
                                </Button>
                              )}
                            </div>

                            {/* Extension Requests */}
                            {isLeader && pendingExtensions.length > 0 && (
                              <div className="bg-muted/50 p-3 rounded space-y-2">
                                <p className="text-sm font-medium">Extension Requests:</p>
                                {pendingExtensions.map((request) => (
                                  <div key={request.id} className="flex items-center justify-between bg-background p-2 rounded">
                                    <div className="text-sm">
                                      <p>New deadline: {new Date(request.newDeadline).toLocaleDateString()}</p>
                                      <p className="text-muted-foreground">{request.reason}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleApproveRequest(request.id, 'extension', task.id)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRejectRequest(request.id, 'extension', task.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamMembers.map((member) => {
                      const memberUser = usersMap[member.userId];
                      if (!memberUser) return null;
                      
                      return (
                        <div key={member.userId} className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {memberUser.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{memberUser.name}</p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-accent">{memberUser.points} points</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {memberUser.badges.length} badges
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link to={`/profile/${member.userId}`}>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
