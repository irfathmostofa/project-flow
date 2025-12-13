import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  User,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
}) {
  const [showActions, setShowActions] = useState(false);

  const statusIcons = {
    completed: <CheckCircle className="h-5 w-5 text-green-500" />,
    "in-progress": <Clock className="h-5 w-5 text-blue-500" />,
    review: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    todo: <Circle className="h-5 w-5 text-gray-400" />,
  };

  const priorityColors = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  const statusColors = {
    completed: "bg-green-100 text-green-700 border-green-200",
    "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
    review: "bg-yellow-100 text-yellow-700 border-yellow-200",
    todo: "bg-gray-100 text-gray-700 border-gray-200",
  };

  if (compact) {
    return (
      <div className="group relative bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <div className="flex items-start space-x-3">
          <button
            onClick={() =>
              onStatusChange?.(
                task.id,
                task.status === "completed" ? "todo" : "completed"
              )
            }
            className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
            aria-label={
              task.status === "completed" ? "Mark as todo" : "Mark as completed"
            }
          >
            {statusIcons[task.status]}
          </button>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold mb-2 ${
                task.status === "completed"
                  ? "line-through text-gray-500"
                  : "text-gray-900"
              }`}
            >
              {task.title}
            </h4>

            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className={`text-xs px-2 py-1 rounded-md font-semibold border ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority.toUpperCase()}
              </span>
              {task.deadline && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md flex items-center border border-gray-200">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(task.deadline), "MMM d")}
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {task.description}
              </p>
            )}

            {task.assignee && (
              <div className="flex items-center text-xs text-gray-600">
                <User className="h-3 w-3 mr-1" />
                <span className="truncate">
                  {task.assignee.full_name || task.assignee.email}
                </span>
              </div>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    onEdit?.(task);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-2"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    onDelete?.(task.id);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Status Change on Hover */}
        <div className="mt-3 pt-3 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {["todo", "in-progress", "review", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange?.(task.id, status)}
                className={`flex-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                  task.status === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title={status.replace("-", " ")}
              >
                {status === "todo" && "📋"}
                {status === "in-progress" && "⏳"}
                {status === "review" && "👀"}
                {status === "completed" && "✅"}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <button
              onClick={() =>
                onStatusChange?.(
                  task.id,
                  task.status === "completed" ? "todo" : "completed"
                )
              }
              className="mt-1 flex-shrink-0 hover:scale-110 transition-transform"
              aria-label={
                task.status === "completed"
                  ? "Mark as todo"
                  : "Mark as completed"
              }
            >
              {statusIcons[task.status]}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h4
                  className={`font-bold text-lg ${
                    task.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-gray-900"
                  }`}
                >
                  {task.title}
                </h4>
              </div>

              <div className="flex flex-wrap gap-1 mb-1">
                <span
                  className={`text-xs px-1 py-1 rounded-full font-semibold border ${
                    priorityColors[task.priority]
                  }`}
                >
                  {task.priority.toUpperCase()}
                </span>
                <span
                  className={`text-xm px-1 py-1 rounded-full font-semibold border ${
                    statusColors[task.status]
                  }`}
                >
                  {task.status.replace("-", " ").toUpperCase()}
                </span>
              </div>

              {task.description && (
                <p className="text-gray-600 text-xs mb-4 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {task.assignee && (
                  <div className="flex items-center space-x-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <User className="h-4 w-4" />
                    <span className="truncate font-medium">
                      {task.assignee.full_name || task.assignee.email}
                    </span>
                  </div>
                )}

                {task.deadline && (
                  <div className="flex items-center space-x-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {format(new Date(task.deadline), "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                {task.milestone && (
                  <span className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-semibold border border-purple-200">
                    📍 {task.milestone.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-1 ml-3 flex-shrink-0">
            <button
              onClick={() => onEdit?.(task)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete?.(task.id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Change Buttons */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {["todo", "in-progress", "review", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange?.(task.id, status)}
                className={`text-xs px-4 py-2 rounded-lg font-semibold capitalize transition-all ${
                  task.status === status
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                }`}
              >
                {status.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
