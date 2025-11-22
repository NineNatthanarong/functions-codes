export default function Footer() {
    return (
        <footer className="border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} functions.codes. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a
                            href="https://www.linkedin.com/in/natthanarong-tiangjit/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
                        >
                            LinkedIn
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
