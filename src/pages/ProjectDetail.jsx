import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { Calendar, Users, Target, ArrowLeft, Edit, Trash2 } from "lucide-react";
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
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Project not found
        </h2>
        <p className="text-gray-600 mb-4">
          The project you're looking for doesn't exist or you don't have access
          to it.
        </p>
        <button onClick={() => navigate("/projects")} className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => navigate("/projects")}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Back to projects"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {project.name}
              </h1>
              <span
                className={`badge p-1 ${
                  project.status === "active"
                    ? "bg-success"
                    : project.status === "completed"
                    ? "bg-info"
                    : "bg-warning"
                }`}
              >
                {project.status}
              </span>
            </div>
            <p className="text-gray-600 mt-2">{project.description}</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-secondary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={deleteProject}
              className="btn-danger flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Deadline</p>
              <p className="font-medium">
                {project.deadline
                  ? format(new Date(project.deadline), "MMM d, yyyy")
                  : "No deadline"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Target className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">
                {format(new Date(project.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Users className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">
                {format(new Date(project.updated_at), "MMM d, yyyy")}
              </p>
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
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
            {["overview", "milestones", "tasks"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
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
  );
}
