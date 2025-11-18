import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProjectsByUser, getUsers } from '@/lib/api';
import { Plus, Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Projects = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allProjects, setAllProjects] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        try {
          const [projects, users] = await Promise.all([getProjectsByUser(user.id), getUsers()]);
          const usersMap = users.reduce((m, u) => ({ ...m, [u.id]: u }), {});
          const projectsWithMeta = projects.map(p => ({
            ...p,
            leader: usersMap[p.leaderId] || null,
            _usersMap: usersMap,
          }));
          setAllProjects(projectsWithMeta);
        } catch (error) {
          console.error('Failed to fetch projects:', error);
        } finally {
          setDataLoading(false);
        }
      };

      fetchProjects();
    }
  }, [user]);

  if (loading || dataLoading || !user) return null;

  const myProjects = allProjects.filter(p => p.leaderId === user.id);
  const collaboratingProjects = allProjects.filter(p => 
    p.leaderId !== user.id && p.teamMembers.some(tm => tm.userId === user.id)
  );

  const filterProjects = (projects) => {
    if (!searchQuery) return projects;
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const ProjectCard = ({ project }) => {
    const leader = project.leader;
    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/project/${project.id}`)}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            <Badge className={
              project.status === 'completed' ? 'bg-success/10 text-success' :
              project.status === 'in-progress' ? 'bg-primary/10 text-primary' :
              'bg-muted text-muted-foreground'
            }>
              {project.status}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{project.teamMembers.length + 1} members</span>
              </div>
              <div className="flex gap-2">
                {project.tags.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Led by: <span className="font-medium text-foreground">{leader?.name || 'Unknown'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold">My Projects</h1>
              <p className="text-muted-foreground mt-2">Manage your projects and collaborations</p>
            </div>
            <Button 
              className="bg-gradient-primary gap-2"
              onClick={() => navigate('/projects/create')}
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
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

          {/* Tabs */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Projects ({allProjects.length})</TabsTrigger>
              <TabsTrigger value="leading">Leading ({myProjects.length})</TabsTrigger>
              <TabsTrigger value="collaborating">Collaborating ({collaboratingProjects.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {filterProjects(allProjects).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'No projects found' : 'No projects yet'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => navigate('/projects/create')}>
                        Create Your First Project
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterProjects(allProjects).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leading" className="mt-6">
              {filterProjects(myProjects).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'No projects found' : 'You are not leading any projects'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => navigate('/projects/create')}>
                        Create a Project
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterProjects(myProjects).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="collaborating" className="mt-6">
              {filterProjects(collaboratingProjects).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No projects found' : 'You are not collaborating on any projects'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterProjects(collaboratingProjects).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Projects;
