import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleOutsideClick = (e) => {
      if (isOpen && e.target.classList.contains("modal-overlay")) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("click", handleOutsideClick);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleOutsideClick);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    full: "max-w-full",
  };

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto ">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] modal-overlay"
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Modal panel */}
        <div
          className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all`}
        >
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold leading-6 text-gray-900">
                {title}
              </h3>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
