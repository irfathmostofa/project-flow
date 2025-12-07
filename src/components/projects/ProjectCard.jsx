import { Link } from "react-router-dom";
import { Calendar, Edit, Trash2, Users, Target } from "lucide-react";
import { format } from "date-fns";

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  viewMode = "grid",
}) {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    "on-hold": "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
  };

  if (viewMode === "list") {
    return (
      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-blue-600" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Link
                  to={`/projects/${project.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 truncate"
                >
                  {project.name}
                </Link>
                <span className={`badge ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>

              {project.description && (
                <p className="text-gray-600 text-sm line-clamp-1">
                  {project.description}
                </p>
              )}

              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                {project.deadline && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(project.deadline), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onEdit?.(project)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(project.id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
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
            <span className={`badge ${statusColors[project.status]}`}>
              {project.status}
            </span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit?.(project)}
              className="p-1 text-gray-500 hover:text-blue-600"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(project.id)}
              className="p-1 text-gray-500 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
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
