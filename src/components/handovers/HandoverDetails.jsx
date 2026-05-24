// components/handovers/HandoverDetails.jsx
import { useState } from "react";
import { format } from "date-fns";
import {
  Download,
  Send,
  CheckCircle,
  X,
  Mail,
  Printer,
  FileText,
  Calendar,
  User,
  Phone,
  Mail as MailIcon,
  DollarSign,
  Clock,
  AlertCircle,
  Users,
  Box,
  Key,
  GraduationCap,
  HeartHandshake,
  Building,
  Globe,
  Lock,
  ExternalLink,
  Check,
} from "lucide-react";

export default function HandoverDetails({ handover, onStatusChange }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [isSending, setIsSending] = useState(false);

  if (!handover) return null;

  const handleSendEmail = async () => {
    setIsSending(true);
    // Implement email sending logic
    setTimeout(() => setIsSending(false), 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Implement PDF generation
    alert("PDF download feature coming soon");
  };

  const sections = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "deliverables", label: "Deliverables", icon: Box },
    { key: "credentials", label: "Credentials", icon: Key },
    { key: "training", label: "Training", icon: GraduationCap },
    { key: "support", label: "Support", icon: HeartHandshake },
  ];

  const deliverableCount = handover.handover_deliverables?.length || 0;
  const credentialCount = handover.handover_credentials?.length || 0;
  const trainingCount = handover.handover_training_sessions?.length || 0;
  const supportCount = handover.handover_support_terms?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {handover.handover_number}
          </h2>
          <p className="text-sm text-gray-500">
            Created {format(new Date(handover.created_at), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          {handover.status === "draft" && (
            <>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send to Client
              </button>
              <button
                onClick={() => onStatusChange(handover.id, "signed")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Signed
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.key;
            let count = 0;
            if (section.key === "deliverables") count = deliverableCount;
            if (section.key === "credentials") count = credentialCount;
            if (section.key === "training") count = trainingCount;
            if (section.key === "support") count = supportCount;

            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`group relative py-3 px-4 font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? "text-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-orange-600" : ""}`}
                />
                <span>{section.label}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      isActive
                        ? "bg-orange-100 text-orange-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Sections */}
      <div className="min-h-[400px]">
        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Project Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-500" />
                Project Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Project Name</p>
                      <p className="font-medium">
                        {handover.project?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Handover Date</p>
                      <p className="font-medium">
                        {format(
                          new Date(handover.handover_date),
                          "MMMM d, yyyy",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Delivered By</p>
                      <p className="font-medium">
                        {handover.delivered_by_user?.full_name || "N/A"}
                      </p>
                      {handover.delivered_by_user?.email && (
                        <p className="text-sm text-gray-500">
                          {handover.delivered_by_user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Received By</p>
                      <p className="font-medium">
                        {handover.received_by_user?.full_name || "N/A"}
                      </p>
                      {handover.received_by_user?.email && (
                        <p className="text-sm text-gray-500">
                          {handover.received_by_user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Box className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">
                  {deliverableCount}
                </p>
                <p className="text-sm text-gray-600">Deliverables</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Key className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {credentialCount}
                </p>
                <p className="text-sm text-gray-600">Credentials</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <GraduationCap className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {trainingCount}
                </p>
                <p className="text-sm text-gray-600">Training Sessions</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <HeartHandshake className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">
                  {supportCount}
                </p>
                <p className="text-sm text-gray-600">Support Terms</p>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Handover Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Document Created
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(
                        new Date(handover.created_at),
                        "MMMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      by {handover.delivered_by_user?.full_name || "System"}
                    </p>
                  </div>
                </div>

                {handover.signed_at && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Document Signed
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(
                          new Date(handover.signed_at),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        by {handover.received_by_user?.full_name || "Client"}
                      </p>
                    </div>
                  </div>
                )}

                {handover.status === "completed" && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <FileCheck className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Handover Completed
                      </p>
                      <p className="text-sm text-gray-500">
                        All deliverables delivered and accepted
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deliverables Section */}
        {activeSection === "deliverables" && (
          <div className="space-y-4">
            {handover.handover_deliverables?.length > 0 ? (
              handover.handover_deliverables.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                        {item.category || "Uncategorized"}
                      </span>
                      <h4 className="text-lg font-semibold text-gray-900 mt-2">
                        {item.feature_name}
                      </h4>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status === "delivered" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {item.status || "Pending"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Box className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No deliverables added yet</p>
              </div>
            )}
          </div>
        )}

        {/* Credentials Section */}
        {activeSection === "credentials" && (
          <div className="space-y-4">
            {handover.handover_credentials?.length > 0 ? (
              handover.handover_credentials.map((cred, index) => (
                <div
                  key={cred.id || index}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        {cred.platform_name}
                      </h4>
                    </div>
                    {cred.access_url && (
                      <a
                        href={cred.access_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Access
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {cred.username && (
                      <div>
                        <p className="text-xs text-gray-500">Username</p>
                        <p className="text-sm font-medium text-gray-900">
                          {cred.username}
                        </p>
                      </div>
                    )}
                    {cred.password_encrypted && (
                      <div>
                        <p className="text-xs text-gray-500">Password</p>
                        <p className="text-sm font-mono text-gray-900">
                          ••••••••
                        </p>
                      </div>
                    )}
                  </div>
                  {cred.additional_notes && (
                    <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                      {cred.additional_notes}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No credentials added yet</p>
              </div>
            )}
          </div>
        )}

        {/* Training Sessions Section */}
        {activeSection === "training" && (
          <div className="space-y-4">
            {handover.handover_training_sessions?.length > 0 ? (
              handover.handover_training_sessions.map((session, index) => (
                <div
                  key={session.id || index}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {session.topic}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(session.session_date),
                            "MMMM d, yyyy",
                          )}
                        </span>
                        <span className="text-sm text-gray-500">
                          Duration: {session.duration_minutes} minutes
                        </span>
                      </div>
                    </div>
                    {session.confirmed_by_trainee && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg">
                        <CheckCircle className="h-3 w-3" />
                        Confirmed
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Trainer</p>
                      <p className="text-sm font-medium text-gray-900">
                        {session.trainer?.full_name ||
                          session.trainer_id ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Trainee</p>
                      <p className="text-sm font-medium text-gray-900">
                        {session.trainee?.full_name ||
                          session.trainee_id ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                  {session.notes && (
                    <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                      {session.notes}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No training sessions scheduled</p>
              </div>
            )}
          </div>
        )}

        {/* Support Terms Section */}
        {activeSection === "support" && (
          <div className="space-y-4">
            {handover.handover_support_terms?.length > 0 ? (
              handover.handover_support_terms.map((term, index) => (
                <div
                  key={term.id || index}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {term.support_type}
                        </h4>
                        {term.included ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            <Check className="h-3 w-3" />
                            Included
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Additional Cost
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(term.start_date),
                            "MMM d, yyyy",
                          )} - {format(new Date(term.end_date), "MMM d, yyyy")}
                        </span>
                        <span className="text-sm text-gray-500">
                          Duration: {term.duration_days} days
                        </span>
                      </div>
                    </div>
                    {!term.included && term.cost > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Cost</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${term.cost}
                        </p>
                      </div>
                    )}
                  </div>
                  {term.description && (
                    <p className="text-gray-600 text-sm mt-3">
                      {term.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <HeartHandshake className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No support terms defined</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last updated:{" "}
            {format(new Date(handover.updated_at), "MMM d, yyyy h:mm a")}
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Status:{" "}
            <span className="capitalize font-medium">{handover.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
