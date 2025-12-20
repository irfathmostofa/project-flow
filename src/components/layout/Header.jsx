import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  FolderKanban,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Bell,
} from "lucide-react";
import Modal from "../ui/Modal";
import ProjectForm from "../projects/ProjectForm";

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const mobileMenuItems = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/projects", icon: FolderKanban, label: "Projects" },
    {
      to: "/projects",
      icon: PlusCircle,
      label: "New",
      action: () => {
        setIsModalOpen(true);
      },
    },
    { to: "/notifications", icon: Bell, label: "Alerts" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  if (!user) return null;

  // Desktop Header
  const DesktopHeader = () => (
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
          <nav className="flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
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
        </div>
      </div>
    </header>
  );

  // Mobile Header with Bottom Navigation
  const MobileHeader = () => (
    <>
      {/* Top Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 md:hidden">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                  ProjectFlow
                </span>
              </Link>
            </div>

            {/* Mobile User Menu */}
            <div className="flex items-center space-x-3">
              <div
                className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="text-blue-600 font-medium text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-16 right-4 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500">Logged in</p>
                </div>

                <Link
                  to="/dashboard"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>

                <Link
                  to="/projects"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FolderKanban className="h-5 w-5 mr-3" />
                  Projects
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Link>

                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50"
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

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
        <div className="flex justify-around items-center h-16">
          {mobileMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            const isCenter = index === 2; // The "New" button in the center

            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={(e) => {
                  if (item.action) {
                    e.preventDefault();
                    item.action();
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isCenter ? "relative -top-4" : ""
                }`}
              >
                {isCenter ? (
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-blue-600 mt-1">
                      {item.label}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Icon
                        className={`h-5 w-5 ${
                          isActive ? "text-blue-600" : "text-gray-500"
                        }`}
                      />
                      {item.label === "Alerts" && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 ${
                        isActive ? "text-blue-600 font-medium" : "text-gray-600"
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for content to avoid overlap with bottom nav */}
      {/* <div className="h-16 md:h-0"></div> */}
    </>
  );

  return (
    <>
      {isMobile ? <MobileHeader /> : <DesktopHeader />}
      {/* Backdrop for mobile menu */}
      {isMenuOpen && isMobile && (
        <div
          className="fixed inset-0 bg-[#0000008f] z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={"Create New Project"}
        size="lg"
      >
        <ProjectForm
          onSuccess={() => {
            handleCloseModal();
          }}
        />
      </Modal>
    </>
  );
}
