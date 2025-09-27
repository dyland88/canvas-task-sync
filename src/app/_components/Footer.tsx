export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="space-y-4 text-center">
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Support
            </a>
          </div>

          <div className="text-xs text-gray-500">
            <p>
              Canvas Task Sync is not affiliated with Instructure Inc. or Google
              LLC.
            </p>
            <p className="mt-1">
              This tool helps you sync your Canvas assignments to Google Tasks
              for better organization.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
