import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Grid, List, Filter, Search } from "lucide-react";
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

      // Apply status filter
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      // Apply search filter
      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      // Apply sorting
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Projects
            </h1>
            <p className="text-gray-600 mt-1">Manage all your projects</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md ${
                  viewMode === "grid" ? "bg-white shadow" : ""
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md ${
                  viewMode === "list" ? "bg-white shadow" : ""
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Filter className="h-4 w-4" />
            </button>

            {/* New Project Button */}
            <button
              onClick={() => {
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Filters Section - Responsive */}
        {(showFilters || window.innerWidth >= 640) && (
          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    placeholder="Search projects..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="flex-1 btn-primary py-2 text-sm"
                >
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="btn-secondary py-2 text-sm"
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
        <div className="card text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filters.status || filters.search
                ? "No projects found"
                : "No projects yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {filters.status || filters.search
                ? "Try changing your filters"
                : "Get started by creating your first project"}
            </p>
            <button
              onClick={() => {
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </button>
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
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
        className="fixed bottom-6 right-6 sm:hidden h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 z-40"
        aria-label="New Project"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
