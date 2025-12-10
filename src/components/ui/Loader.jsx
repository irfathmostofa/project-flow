import { Loader2 } from "lucide-react";

export function Loader({ size = "md", className = "" }) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
    "2xl": "h-10 w-10",
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
}

export function ButtonLoader({ size = "sm" }) {
  return <Loader size={size} className="inline mr-2" />;
}

export function PageLoader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

export function InlineLoader({ message = "Loading..." }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}
