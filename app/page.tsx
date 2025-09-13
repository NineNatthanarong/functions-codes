'use client'

import { useState } from 'react'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  // Define all tools with their information
  const allTools = [
    {
      id: 'qr-generator',
      title: 'QR Code Generator',
      description: 'Create beautiful, customizable QR codes with professional quality and Apple-inspired design',
      icon: '📱',
      href: '/qr-generator',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      ringColor: 'focus:ring-blue-500'
    },
    {
      id: 'background-remover',
      title: 'Background Remover',
      description: 'Remove backgrounds from images instantly with AI-powered precision and professional results',
      icon: '✨',
      href: '/bgrm',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      ringColor: 'focus:ring-purple-500'
    }
  ]

  // Filter tools based on search query
  const filteredTools = allTools.filter(tool =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-semibold text-gray-900 mb-6 tracking-tight">
            Functions & Codes
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Discover powerful development tools and utilities designed with simplicity and elegance in mind. 
            Built for developers who appreciate clean, functional design.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg text-gray-800 placeholder-gray-500 bg-white shadow-sm hover:shadow-md focus:shadow-lg"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
              Development Tools
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional-grade utilities crafted with attention to detail and user experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Render filtered tools */}
            {filteredTools.map((tool) => (
              <div key={tool.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                <div className="mb-6">
                  <div className={`${tool.bgColor} ${tool.textColor} p-4 rounded-xl inline-flex text-2xl shadow-sm`}>
                    {tool.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {tool.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                  {tool.description}
                </p>
                <a
                  href={tool.href}
                  className={`${tool.buttonColor} text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 ${tool.ringColor} focus:ring-offset-2 w-full text-center inline-block shadow-sm hover:shadow-md transform hover:scale-105 mt-auto`}
                >
                  Try {tool.title}
                </a>
              </div>
            ))}

            {/* Show "More Tools Coming" only if we have results and search is empty */}
            {filteredTools.length > 0 && searchQuery === '' && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-8 text-center group hover:border-gray-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                <div className="py-8 flex flex-col justify-center h-full">
                  <div className="text-4xl mb-4 text-gray-400 group-hover:text-gray-500 transition-colors transform group-hover:scale-110 duration-300">⚡</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-3">
                    More Tools Coming
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    We&apos;re building more amazing developer tools with the same attention to design and functionality
                  </p>
                </div>
              </div>
            )}

            {/* Show no results message */}
            {filteredTools.length === 0 && searchQuery !== '' && (
              <div className="col-span-full text-center py-16">
                <div className="text-6xl mb-4 text-gray-300 transform hover:scale-110 transition-transform duration-300">🔍</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No tools found
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Try searching for &quot;QR&quot; or &quot;Background&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
