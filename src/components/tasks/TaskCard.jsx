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
  Eye,
  MessageSquare,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TaskDetails } from "./TaskDetails";

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  // Compact view
  if (compact) {
    return (
      <div className="group relative bg-gradient-to-br from-white to-gray-50 p-2 md:p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <div className="flex items-start space-x-3">
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

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {task.assignees && task.assignees.length > 0 ? (
                <>
                  <Users className="h-4 w-4" />
                  <span>
                    {task.assignees
                      .slice(0, 2)
                      .map((user) => user.full_name || user.email)
                      .join(", ")}
                    {task.assignees.length > 2 &&
                      ` +${task.assignees.length - 2}`}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
            </div>
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
                    setShowDetails(true);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-2"
                >
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </button>
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
        <div className="mt-3 pt-3 border-t border-gray-200">
          <select
            value={task.status}
            onChange={(e) => onStatusChange?.(task.id, e.target.value)}
            className="w-full text-xs px-2 py-1 rounded-md font-medium border border-gray-300 bg-white text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todo">📋 Todo</option>
            <option value="in-progress">⏳ In Progress</option>
            <option value="review">👀 Review</option>
            <option value="completed">✅ Completed</option>
          </select>
        </div>

        {/* Details Modal for Compact View */}
        {showDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <TaskDetails
                task={task}
                onClose={() => setShowDetails(false)}
                onEdit={() => {
                  setShowDetails(false);
                  onEdit?.(task);
                }}
                onDelete={() => {
                  setShowDetails(false);
                  onDelete?.(task.id);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view
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

              {/* Show suggestions/feedback preview */}
              {(task.suggestions || task.feedback) && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="mt-4 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      View
                      {task.suggestions && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          Suggestions
                        </span>
                      )}
                      {task.feedback && (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          <ThumbsUp className="h-3 w-3 inline mr-1" />
                          Feedback
                        </span>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex space-x-1 ml-3 flex-shrink-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
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

        {/* Expandable Details Section */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {task.suggestions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <h5 className="font-semibold text-blue-800">Suggestions</h5>
                    {task.suggestion_by_user && (
                      <span className="text-xs text-blue-600 ml-auto">
                        By:{" "}
                        {task.suggestion_by_user.full_name ||
                          task.suggestion_by_user.email}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 whitespace-pre-line">
                    {task.suggestions}
                  </p>
                </div>
              )}

              {task.feedback && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <h5 className="font-semibold text-green-800">Feedback</h5>
                    <div className="ml-auto text-xs space-x-2">
                      {task.feedback_by_user && (
                        <span className="text-green-600">
                          By:{" "}
                          {task.feedback_by_user.full_name ||
                            task.feedback_by_user.email}
                        </span>
                      )}
                      {task.feedback_date && (
                        <span className="text-green-600">
                          |{" "}
                          {format(new Date(task.feedback_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-green-700 whitespace-pre-line">
                    {task.feedback}
                  </p>
                </div>
              )}

              {/* If no suggestions or feedback */}
              {!task.suggestions && !task.feedback && (
                <div className="text-center py-6 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No suggestions or feedback yet.</p>
                  <p className="text-xs mt-1">
                    Add some when editing the task.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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
