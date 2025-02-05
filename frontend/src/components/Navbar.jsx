import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <Link to="/" className="text-xl font-bold">Roommatebase</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">Roommatebase</Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/create-form">Create Listing</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/submissions">Submissions</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/my-submissions">My Applications</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/signin">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-[57px] bg-background z-50 md:hidden">
            <div className="container mx-auto px-4 py-6 space-y-4 overflow-y-auto max-h-[calc(100vh-57px)]">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <Button asChild variant="default" className="w-full h-12 text-lg">
                    <Link to="/create-form">Create Listing</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 text-lg">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 text-lg">
                    <Link to="/submissions">Submissions</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 text-lg">
                    <Link to="/my-submissions">My Applications</Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full h-12 text-lg"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button asChild variant="default" className="w-full h-12 text-lg">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 text-lg">
                    <Link to="/signin">Sign In</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;