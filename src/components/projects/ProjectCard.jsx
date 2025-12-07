import { Link } from "react-router-dom";
import { Calendar, Users, Target, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  viewMode = "grid",
}) {
  const isGrid = viewMode === "grid";

  if (isGrid) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              <Link
                to={`/projects/${project.id}`}
                className="hover:text-blue-600"
              >
                {project.name}
              </Link>
            </h3>
            <span
              className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                project.status === "active"
                  ? "bg-green-100 text-green-800"
                  : project.status === "completed"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {project.status}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit?.(project)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => onDelete?.(project.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="space-y-2 text-sm text-gray-500">
          {project.deadline && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}
              </span>
            </div>
          )}

          <div className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            <span>
              Created: {format(new Date(project.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            to={`/projects/${project.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">
              <Link
                to={`/projects/${project.id}`}
                className="hover:text-blue-600"
              >
                {project.name}
              </Link>
            </h3>
            <p className="text-sm text-gray-500 line-clamp-1">
              {project.description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm text-gray-500">Status</div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                project.status === "active"
                  ? "bg-green-100 text-green-800"
                  : project.status === "completed"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {project.status}
            </span>
          </div>

          {project.deadline && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Deadline</div>
              <div className="text-sm font-medium">
                {format(new Date(project.deadline), "MMM d")}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => onEdit?.(project)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => onDelete?.(project.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
