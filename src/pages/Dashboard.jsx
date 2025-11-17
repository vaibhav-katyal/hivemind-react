import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProjectsByUser, getTasksByUser } from '@/lib/api';
import { Award, Briefcase, CheckCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userProjects, setUserProjects] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const projects = await getProjectsByUser(user.id);
          const tasks = await getTasksByUser(user.id);
          setUserProjects(projects);
          setUserTasks(tasks);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        } finally {
          setDataLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  if (loading || dataLoading) return null;
  if (!user) return null;

  const activeTasks = userTasks.filter(t => t.status !== 'completed');
  const completedTasks = userTasks.filter(t => t.status === 'completed');
  const activeProjects = userProjects.filter(p => p.status !== 'completed');
  const completedProjects = userProjects.filter(p => p.status === 'completed');

  const stats = [
    { title: 'Total Points', value: user.points, icon: Award, color: 'text-accent' },
    { title: 'Active Projects', value: activeProjects.length, icon: Briefcase, color: 'text-primary' },
    { title: 'Completed Tasks', value: completedTasks.length, icon: CheckCircle, color: 'text-success' },
    { title: 'Pending Tasks', value: activeTasks.length, icon: Clock, color: 'text-secondary' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold">Welcome back, {user.name}! 👋</h1>
              <p className="text-muted-foreground mt-2">Here's what's happening with your projects</p>
            </div>
            <Link to="/projects/create">
              <Button className="bg-gradient-primary">Create New Project</Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No active projects yet</p>
                  <Link to="/projects/create">
                    <Button variant="outline">Create Your First Project</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProjects.slice(0, 3).map((project) => (
                    <div key={project.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {project.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Badges */}
          {user.badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {user.badges.slice(0, 5).map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 border border-border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="text-3xl">{badge.icon}</div>
                      <div>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
