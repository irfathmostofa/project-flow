import { Link } from "react-router-dom";
import {
  Calendar,
  Edit,
  Trash2,
  Users,
  Target,
  Share2,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import ProjectInvitationButton from "./ProjectInvitation";

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onInvite,
  isOwner = false,
  viewMode = "grid",
}) {
  const statusColors = {
    active: "bg-green-100 text-green-800 border-green-200",
    "on-hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
  };

  // Get member count
  const memberCount = project.project_members?.length || 0;

  if (viewMode === "list") {
    return (
      <div className="group bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-4">
        <div className="flex items-start justify-between">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <Target className="h-5 w-5 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 ">
                  <Link
                    to={`/projects/${project.id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 truncate text-base"
                    title={project.name}
                  >
                    {project.name}
                  </Link>
                  <div className="flex gap-2 flex-shrink-0">
                    <span
                      className={`badge p-1 rounded ${
                        statusColors[project.status]
                      }`}
                    >
                      {project.status}
                    </span>
                    {!isOwner && (
                      <span className="badge p-1 rounded bg-purple-100 text-purple-700 border-purple-200">
                        Shared
                      </span>
                    )}
                  </div>
                </div>

                {project.description && (
                  <p className="text-gray-600 text-sm line-clamp-1 mb-3">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {project.created_at && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      <span>
                        Create {format(new Date(project.created_at), "MMM d")}
                      </span>
                    </div>
                  )}
                  {project.deadline && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      <span>
                        Due {format(new Date(project.deadline), "MMM d")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1.5" />
                    <span>
                      {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
            {isOwner && (
              <div className="relative">
                <ProjectInvitationButton
                  projectId={project.id}
                  projectName={project.name}
                />
              </div>
            )}

            {isOwner && (
              <button
                onClick={() => onEdit?.(project)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onDelete?.(project.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="card p-5 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              <Link
                to={`/projects/${project.id}`}
                className="hover:text-blue-600"
              >
                {project.name}
              </Link>
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <span
                className={`badge p-2 border ${statusColors[project.status]}`}
              >
                {project.status}
              </span>
              {!isOwner && (
                <span className="badge bg-purple-100 text-purple-800 border-purple-200">
                  Shared
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-1">
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => onInvite?.(project)}
                  className="p-1 text-gray-500 hover:text-green-600"
                  title="Invite"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>
            )}
            {isOwner && (
              <button
                onClick={() => onEdit?.(project)}
                className="p-1 text-gray-500 hover:text-blue-600"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onDelete?.(project.id)}
                className="p-1 text-gray-500 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {project.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-500">
          {project.deadline && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>
                Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}
              </span>
            </div>
          )}

          <div className="flex items-center">
            <Target className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              Created: {format(new Date(project.created_at), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link
          to={`/projects/${project.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
        >
          View Details
          <svg
            className="ml-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
