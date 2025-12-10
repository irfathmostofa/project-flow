import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Grid,
  List,
  Filter,
  Search,
  FolderKanban,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import ProjectForm from "./ProjectForm";
import ProjectCard from "./ProjectCard";
import Modal from "../ui/Modal";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    status: "",
    sortBy: "newest",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      let query = supabase.from("projects").select("*");

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      switch (filters.sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "deadline":
          query = query.order("deadline", { ascending: true });
          break;
        case "name":
          query = query.order("name", { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setLoading(true);
    fetchProjects();
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      sortBy: "newest",
      search: "",
    });
    setLoading(true);
    setTimeout(() => {
      fetchProjects();
    }, 100);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6 sm:p-8">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 opacity-10 rounded-full -ml-16 -mb-16"></div>

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
                  {projects.length} project{projects.length !== 1 ? "s" : ""}{" "}
                  total
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gradient-to-r from-gray-100 to-slate-100 p-1 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white shadow-md text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow-md text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="List View"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

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
                  <X className="h-5 w-5" />
                ) : (
                  <Filter className="h-5 w-5" />
                )}
                <span>{showFilters ? "Hide Filters" : "Filters"}</span>
              </button>

              {/* New Project Button */}
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

          {/* Filters Section */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t-2 border-gray-100 animate-slideDown">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      placeholder="Search projects..."
                      className="pl-10 w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

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
                <div className="flex items-end space-x-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Clear
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

        {/* Projects Grid/List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 text-center py-16 px-6">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderKanban className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {filters.status || filters.search
                  ? "No projects found"
                  : "No projects yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.status || filters.search
                  ? "Try adjusting your filters to see more results"
                  : "Create your first project to get started with managing your work"}
              </p>
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
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                onEdit={() => handleEdit(project)}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}

        {/* Mobile Floating Action Button */}
        <button
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="fixed bottom-6 right-6 lg:hidden h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transform hover:scale-110 transition-all z-40"
          aria-label="New Project"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
