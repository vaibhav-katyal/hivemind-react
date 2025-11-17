import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { Trophy, Users, Target, Award, TrendingUp, Shield } from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Trophy,
      title: 'Showcase Leadership',
      description: 'Earn badges and recognition for leading successful projects and teams.',
    },
    {
      icon: Users,
      title: 'Build Team Skills',
      description: 'Demonstrate your collaboration abilities through real project contributions.',
    },
    {
      icon: Target,
      title: 'Track Progress',
      description: 'Monitor your growth with detailed analytics and achievement tracking.',
    },
    {
      icon: Award,
      title: 'Earn Rewards',
      description: 'Collect points and badges that showcase your professional capabilities.',
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Build a shareable profile that demonstrates your project management skills.',
    },
    {
      icon: Shield,
      title: 'Verified Skills',
      description: 'Share your HiveMind profile as proof of your leadership and teamwork abilities.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Showcase Your{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Leadership
              </span>{' '}
              & Teamwork Skills
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The first platform where your collaboration abilities are tracked, verified, and shareable.
              Build projects, earn badges, and create a profile that proves your worth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary text-lg px-8">
                  Start Building
                </Button>
              </Link>
              <Link to="/community">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Explore Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why HiveMind?</h2>
            <p className="text-xl text-muted-foreground">
              In today's world, collaboration is key. Finally, there's a way to prove it.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary border-none overflow-hidden">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-4xl font-bold text-primary-foreground">
                Ready to Showcase Your Skills?
              </h2>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Join HiveMind today and start building a profile that truly represents your
                leadership and collaboration abilities.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Join HiveMind
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 HiveMind. Empowering teams, one project at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
