import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Filter,
  Search,
  FolderKanban,
  Sparkles,
  X,
  Zap,
  Mail,
} from "lucide-react";
import ProjectForm from "./ProjectForm";
import ProjectCard from "./ProjectCard";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import ProjectInvitation from "./ProjectInvitation";
import DashboardInvitations from "./DashboardInvitations"; // Add this import

export default function ProjectList() {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedProjectForInvite, setSelectedProjectForInvite] =
    useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    sortBy: "newest",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "owned", "shared"
  const { user } = useAuth();
  const [hasInvitations, setHasInvitations] = useState(false); // Add state for invitations

  useEffect(() => {
    if (user) {
      fetchProjects();
      checkInvitations();
    }
  }, [user]);

  // Add this function to check for invitations
  const checkInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("project_invitations")
        .select("id")
        .eq("invitee_email", user.email)
        .eq("status", "pending")
        .limit(1);

      if (!error) {
        setHasInvitations(data && data.length > 0);
      }
    } catch (error) {
      console.error("Error checking invitations:", error);
    }
  };

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch owned projects
      const { data: ownedProjects, error: ownedError } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", user.id);

      if (ownedError) throw ownedError;

      // Fetch project members to find shared projects
      const { data: memberProjects, error: memberError } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      let sharedProjects = [];
      if (memberProjects && memberProjects.length > 0) {
        const projectIds = memberProjects.map((m) => m.project_id);

        // Filter out projects that user already owns
        const sharedProjectIds = projectIds.filter(
          (projectId) => !ownedProjects?.some((owned) => owned.id === projectId)
        );

        if (sharedProjectIds.length > 0) {
          const { data: sharedData, error: sharedError } = await supabase
            .from("projects")
            .select("*")
            .in("id", sharedProjectIds);

          if (sharedError) throw sharedError;
          sharedProjects = sharedData || [];
        }
      }

      // Combine and add isOwner flag
      const allProjectsData = [
        ...(ownedProjects || []).map((project) => ({
          ...project,
          isOwner: true,
        })),
        ...(sharedProjects || []).map((project) => ({
          ...project,
          isOwner: false,
        })),
      ];

      // Sort by created_at descending
      allProjectsData.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setAllProjects(allProjectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on active tab
  const getFilteredProjects = () => {
    let filtered = allProjects;

    // Apply tab filter
    if (activeTab === "owned") {
      filtered = filtered.filter((project) => project.isOwner);
    } else if (activeTab === "shared") {
      filtered = filtered.filter((project) => !project.isOwner);
    }

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          (project.description || "")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(
        (project) => project.status === filters.status
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "newest":
        return filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      case "oldest":
        return filtered.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      case "deadline":
        return filtered.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
      case "name":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered;
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      // Delete project members first (if they exist)
      await supabase.from("project_members").delete().eq("project_id", id);

      // Delete the project
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setAllProjects((prev) => prev.filter((project) => project.id !== id));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project: " + error.message);
    }
  };

  const handleInviteToProject = (project) => {
    setSelectedProjectForInvite(project);
    setIsInviteModalOpen(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    // Filters are applied in getFilteredProjects, no need to fetch again
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      sortBy: "newest",
      search: "",
    });
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setSelectedProjectForInvite(null);
  };

  // Add callback function for when invitations are accepted/declined
  const handleInvitationAction = () => {
    fetchProjects(); // Refresh projects list to show newly joined projects
    checkInvitations(); // Update invitation count
  };

  const filteredProjects = getFilteredProjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  const ownedCount = allProjects.filter((p) => p.isOwner).length;
  const sharedCount = allProjects.filter((p) => !p.isOwner).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 ">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header Section */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6 sm:p-8">
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <FolderKanban className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Projects
                  </h1>
                  <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                </div>
                <p className="text-gray-600 mt-1">
                  {filteredProjects.length} project
                  {filteredProjects.length !== 1 ? "s" : ""} total
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Invitations Badge (optional) */}
              {hasInvitations && (
                <div className="relative">
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div>
                  <button
                    onClick={() => {
                      // Scroll to invitations section
                      document
                        .getElementById("invitations-section")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors"
                    title="View Pending Invitations"
                  >
                    <Mail className="h-5 w-5 text-yellow-600" />
                  </button>
                </div>
              )}

              {/* New Project Button */}
              <div className="hidden lg:block">
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setIsModalOpen(true);
                  }}
                  className="group px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                  <span>New Project</span>
                </button>
              </div>
            </div>
          </div>

          {/* Project Type Tabs */}
          <div className="mt-6 flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "all"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Projects
              {activeTab === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {allProjects.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("owned")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "owned"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              My Projects
              {activeTab === "owned" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {ownedCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "shared"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Shared With Me
              {activeTab === "shared" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {sharedCount}
              </span>
            </button>
          </div>

          {/* Filters Section */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
                  showFilters
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 hover:border-blue-300"
                }`}
              >
                {showFilters ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                <span>{showFilters ? "Hide Filters" : "Filters"}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search projects..."
                  className="pl-10 w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t-2 border-gray-100 animate-slideDown">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="deadline">Deadline</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                {/* Filter Actions */}
                <div className="flex items-end space-x-2 lg:col-span-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Apply Filters</span>
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingProject ? "Edit Project" : "Create New Project"}
          size="lg"
        >
          <ProjectForm
            initialData={editingProject}
            onSuccess={() => {
              handleCloseModal();
              fetchProjects();
            }}
          />
        </Modal>

        {/* Invitation Modal */}
        <Modal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          title={`Invite to ${selectedProjectForInvite?.name}`}
          size="md"
        >
          <ProjectInvitation
            projectId={selectedProjectForInvite?.id}
            onSuccess={() => {
              handleCloseInviteModal();
              fetchProjects();
            }}
          />
        </Modal>

        {/* Pending Invitations Section */}
        <div id="invitations-section">
          <DashboardInvitations onInvitationAction={handleInvitationAction} />
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 text-center py-16 px-6">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderKanban className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {filters.status || filters.search
                  ? "No projects found"
                  : activeTab === "owned"
                  ? "No projects yet"
                  : activeTab === "shared"
                  ? "No shared projects"
                  : "No projects yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.status || filters.search
                  ? "Try adjusting your filters to see more results"
                  : activeTab === "owned"
                  ? "Create your first project to get started"
                  : activeTab === "shared"
                  ? "You haven't been invited to any projects yet"
                  : "Get started by creating your first project"}
              </p>
              {activeTab !== "shared" && (
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setIsModalOpen(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Project</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode="list" // Force list view
                isOwner={project.isOwner}
                onEdit={() => handleEdit(project)}
                onDelete={deleteProject}
                onInvite={() => handleInviteToProject(project)}
              />
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => {
          setEditingProject(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-21 right-6 lg:hidden h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transform hover:scale-110 transition-all z-40"
        aria-label="New Project"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
