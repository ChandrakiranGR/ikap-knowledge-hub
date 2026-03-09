import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <header className="bg-foreground sticky top-0 z-50 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary-foreground" />
          <span className="text-xl font-bold tracking-tight text-primary-foreground">IKAP</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link to="/chat">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Chat
            </Button>
          </Link>

          {isAdmin && isAdminRoute && (
            <>
              <Link to="/admin/ingest">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  Ingest
                </Button>
              </Link>
              <Link to="/admin/articles">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  Articles
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  Settings
                </Button>
              </Link>
              <Link to="/admin/eval">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  Eval
                </Button>
              </Link>
            </>
          )}

          {user ? (
            <Button variant="secondary" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          ) : (
            <Link to="/admin/login">
              <Button variant="secondary" size="sm">
                Admin Login
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
