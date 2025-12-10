import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const ToastItem = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "text-green-500",
      button: "text-green-500 hover:bg-green-100",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "text-red-500",
      button: "text-red-500 hover:bg-red-100",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "text-yellow-500",
      button: "text-yellow-500 hover:bg-yellow-100",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-500",
      button: "text-blue-500 hover:bg-blue-100",
    },
  };

  const Icon = icons[toast.type];
  const colorConfig = colors[toast.type];

  // Handle auto-dismiss
  useEffect(() => {
    if (toast.duration === 0) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration - 300); // Start exit animation 300ms before removing

    return () => clearTimeout(timer);
  }, [toast.duration, toast.id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={`fixed ${
        positionClasses[toast.position]
      } z-[1000] transition-all duration-300 ${
        isExiting
          ? "opacity-0 translate-y-[-10px]"
          : "opacity-100 translate-y-0"
      }`}
    >
      <div
        className={`${colorConfig.bg} ${colorConfig.border} border rounded-lg shadow-lg max-w-sm w-full`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="shrink-0">
              <Icon className={`h-5 w-5 ${colorConfig.icon}`} />
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${colorConfig.text}`}>
                {toast.message}
              </p>
            </div>
            <div className="ml-4 shrink-0 flex">
              <button
                type="button"
                onClick={handleClose}
                className={`inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${colorConfig.button}`}
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress bar for auto-dismiss */}
          {toast.duration > 0 && (
            <div className="mt-2">
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorConfig.bg.replace(
                    "50",
                    "400"
                  )} transition-all duration-${toast.duration} ease-linear`}
                  style={{
                    width: isExiting ? "0%" : "100%",
                    transitionDuration: `${toast.duration}ms`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  // Group toasts by position
  const groupedToasts = toasts.reduce((acc, toast) => {
    if (!acc[toast.position]) {
      acc[toast.position] = [];
    }
    acc[toast.position].push(toast);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div key={position} className={`fixed ${position} z-1000 space-y-2`}>
          {positionToasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      ))}
    </>
  );
}
