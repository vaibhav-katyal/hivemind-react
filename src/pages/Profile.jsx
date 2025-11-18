import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getUserById, getProjectsByUser } from '@/lib/api';
import { Award, Briefcase, Calendar, Share2, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileUser, setProfileUser] = useState(currentUser);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    const fetchProfileData = async () => {
      try {
        if (userId && userId !== currentUser.id) {
          const user = await getUserById(userId);
          if (user) {
            setProfileUser(user);
            const projects = await getProjectsByUser(user.id);
            setUserProjects(projects);
          }
        } else {
          setProfileUser(currentUser);
          const projects = await getProjectsByUser(currentUser.id);
          setUserProjects(projects);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, currentUser, authLoading, navigate]);

  if (loading || !profileUser) return null;

  const activeProjects = userProjects.filter(p => p.status !== 'completed');
  const completedProjects = userProjects.filter(p => p.status === 'completed');
  const isOwnProfile = currentUser?.id === profileUser.id;

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${profileUser.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Profile link copied!",
      description: "Share your HiveMind profile with others.",
    });
  };

  const joinedDate = new Date(profileUser.joinedDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-primary" />
          <CardContent className="relative pt-16 pb-8">
            <Avatar className="absolute -top-16 left-8 h-32 w-32 border-4 border-background">
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                {profileUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-44 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{profileUser.name}</h1>
                {profileUser.bio && (
                  <p className="text-muted-foreground mt-2">{profileUser.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {joinedDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {profileUser.points} points
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {userProjects.length} projects
                  </div>
                </div>
              </div>
              <Button onClick={handleShare} variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-accent" />
              <p className="text-3xl font-bold">{profileUser.points}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{profileUser.badges.length}</p>
              <p className="text-sm text-muted-foreground">Badges Earned</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-6 text-center">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <p className="text-3xl font-bold">{completedProjects.length}</p>
              <p className="text-sm text-muted-foreground">Completed Projects</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges & Projects Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="badges">
              <TabsList className="mb-6">
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="active">Active Projects</TabsTrigger>
                <TabsTrigger value="completed">Completed Projects</TabsTrigger>
              </TabsList>

              <TabsContent value="badges">
                {profileUser.badges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No badges earned yet</p>
                    {isOwnProfile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Complete projects and tasks to earn badges!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profileUser.badges.map((badge) => (
                      <div key={badge.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="text-5xl mb-3">{badge.icon}</div>
                        <h3 className="font-semibold text-lg">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Earned {new Date(badge.earnedDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active">
                {activeProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active projects</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeProjects.map((project) => (
                      <div key={project.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                            <div className="flex gap-2">
                              {project.tags.map((tag, i) => (
                                <Badge key={i} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                          <Badge className="bg-primary/10 text-primary">{project.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No completed projects yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedProjects.map((project) => (
                      <div key={project.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                            <div className="flex gap-2">
                              {project.tags.map((tag, i) => (
                                <Badge key={i} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                          <Badge className="bg-success/10 text-success">Completed</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
