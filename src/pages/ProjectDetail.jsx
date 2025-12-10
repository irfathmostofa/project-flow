import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import {
  Calendar,
  Users,
  Target,
  ArrowLeft,
  Edit,
  Trash2,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import MilestoneList from "../components/milestones/MilestoneList";
import TaskList from "../components/tasks/TaskList";
import ProjectForm from "../components/projects/ProjectForm";
import Modal from "../components/ui/Modal";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    )
      return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
          <div className="w-20 h-20 bg-linear-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project not found
          </h2>
          <p className="text-gray-600 mb-6">
            The project you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center mx-auto"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const configs = {
      active: {
        gradient: "from-green-500 to-emerald-600",
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
      completed: {
        gradient: "from-blue-500 to-indigo-600",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      },
      planning: {
        gradient: "from-yellow-500 to-orange-600",
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
      },
      on_hold: {
        gradient: "from-gray-500 to-slate-600",
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      },
    };
    return configs[status] || configs.planning;
  };

  const statusConfig = getStatusConfig(project.status);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-2">
      <div className="max-w-full mx-auto space-y-6">
        {/* Project Header */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Decorative Background */}
          <div
            className={`absolute top-0 right-0 w-64 h-64 bg-linear-to-br ${statusConfig.gradient} opacity-10 rounded-full -mr-32 -mt-32`}
          ></div>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-6 lg:space-y-0">
              <div className="flex-1">
                <div className="flex items-start space-x-3 mb-4">
                  <button
                    onClick={() => navigate("/projects")}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all hover:scale-110"
                    title="Back to projects"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        {project.name}
                      </h1>
                      <span
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {project.status.replace("_", " ").toUpperCase()}
                      </span>
                      <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                    </div>
                    <p className="text-gray-600 text-lg">
                      {project.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="group px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300 text-blue-700 rounded-xl font-semibold hover:shadow-md transition-all flex items-center"
                >
                  <Edit className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Edit
                </button>
                <button
                  onClick={deleteProject}
                  className="group px-5 py-3 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 hover:border-red-300 text-red-700 rounded-xl font-semibold hover:shadow-md transition-all flex items-center"
                >
                  <Trash2 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Delete
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="group p-5 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">Deadline</p>
                    <p className="text-lg font-bold text-gray-900">
                      {project.deadline
                        ? format(new Date(project.deadline), "MMM d, yyyy")
                        : "No deadline"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="group p-5 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100 hover:border-green-300 hover:shadow-md transition-all">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">Created</p>
                    <p className="text-lg font-bold text-gray-900">
                      {format(new Date(project.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="group p-5 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-md transition-all">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">
                      Last Updated
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {format(new Date(project.updated_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Project Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Project"
          size="lg"
        >
          <ProjectForm
            initialData={project}
            onSuccess={() => {
              setIsEditModalOpen(false);
              fetchProject();
            }}
          />
        </Modal>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200 px-6">
            <nav className="flex space-x-2 overflow-x-auto">
              {[
                { key: "overview", label: "Overview", icon: Layers },
                { key: "milestones", label: "Milestones", icon: Target },
                { key: "tasks", label: "Tasks", icon: CheckCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`group relative py-4 px-6 font-bold text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
                      activeTab === tab.key
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        activeTab === tab.key
                          ? "scale-110"
                          : "group-hover:scale-110"
                      } transition-transform`}
                    />
                    <span>{tab.label}</span>
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-full"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <MilestoneList projectId={project.id} />
              </div>
            )}

            {activeTab === "milestones" && (
              <MilestoneList projectId={project.id} />
            )}

            {activeTab === "tasks" && <TaskList projectId={project.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
