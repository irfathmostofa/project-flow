import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  FolderKanban,
  User,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const menuItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/projects", icon: FolderKanban, label: "Projects" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">
                ProjectFlow
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium"
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {item.label}
                </Link>
              );
            })}

            <button
              onClick={handleSignOut}
              className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-gray-50 font-medium ml-2"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </button>

            {/* User Avatar */}
            <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="ml-2 text-sm text-gray-700 hidden lg:inline max-w-[150px] truncate">
                {user.email}
              </span>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center px-3 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="px-3 py-2 flex items-center">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500">Logged in</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center px-3 py-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg font-medium mt-1"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
