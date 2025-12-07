import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-4 sm:py-6">
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom padding */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
}
