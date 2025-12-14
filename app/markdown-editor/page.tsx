'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Save, FileText, Eye, Code, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function MarkdownEditor() {
    const [markdown, setMarkdown] = useState('# Welcome to Markdown Editor\n\nStart typing your markdown here...\n\n## Features\n- Live preview\n- Export as HTML\n- Export as PDF\n- Auto-save to browser\n\n```javascript\nconst hello = "world";\nconsole.log(hello);\n```\n\n**Bold text** and *italic text*\n\n[Links work too](https://functions.codes)');
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem('markdown-draft');
        if (saved) {
            setMarkdown(saved);
            toast.success('Draft loaded from browser');
        }
    }, []);

    useEffect(() => {
        // Auto-save every 5 seconds
        const timer = setTimeout(() => {
            localStorage.setItem('markdown-draft', markdown);
        }, 5000);

        // Update counts
        const words = markdown.trim().split(/\s+/).filter(Boolean).length;
        const chars = markdown.length;
        setWordCount(words);
        setCharCount(chars);

        return () => clearTimeout(timer);
    }, [markdown]);

    const exportAsHTML = () => {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            color: #666;
            margin: 16px 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f4f4f4;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    ${document.getElementById('markdown-preview')?.innerHTML || ''}
</body>
</html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'markdown-export.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Exported as HTML!');
    };

    const exportAsPDF = async () => {
        const element = document.getElementById('markdown-preview');
        if (!element) return;

        toast.info('Generating PDF...');

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('markdown-export.pdf');
            toast.success('Exported as PDF!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export PDF');
        }
    };

    const insertMarkdown = (syntax: string, placeholder = 'text') => {
        const textarea = document.getElementById('markdown-input') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = markdown.substring(start, end) || placeholder;
        const before = markdown.substring(0, start);
        const after = markdown.substring(end);

        let newText = '';
        let cursorPos = start;

        switch (syntax) {
            case 'bold':
                newText = `${before}**${selectedText}**${after}`;
                cursorPos = start + 2;
                break;
            case 'italic':
                newText = `${before}*${selectedText}*${after}`;
                cursorPos = start + 1;
                break;
            case 'code':
                newText = `${before}\`${selectedText}\`${after}`;
                cursorPos = start + 1;
                break;
            case 'link':
                newText = `${before}[${selectedText}](url)${after}`;
                cursorPos = start + selectedText.length + 3;
                break;
            case 'h1':
                newText = `${before}# ${selectedText}${after}`;
                cursorPos = start + 2;
                break;
            case 'h2':
                newText = `${before}## ${selectedText}${after}`;
                cursorPos = start + 3;
                break;
            case 'ul':
                newText = `${before}- ${selectedText}${after}`;
                cursorPos = start + 2;
                break;
            case 'ol':
                newText = `${before}1. ${selectedText}${after}`;
                cursorPos = start + 3;
                break;
        }

        setMarkdown(newText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
    };

    const clearDraft = () => {
        if (confirm('Are you sure you want to clear the editor?')) {
            setMarkdown('');
            localStorage.removeItem('markdown-draft');
            toast.success('Editor cleared');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        Markdown Editor
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Write markdown with live preview. Export as HTML or PDF.
                    </motion.p>
                </div>

                {/* Toolbar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap items-center justify-between gap-4"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => insertMarkdown('h1')}
                            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition-colors"
                            title="Heading 1"
                        >
                            H1
                        </button>
                        <button
                            onClick={() => insertMarkdown('h2')}
                            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition-colors"
                            title="Heading 2"
                        >
                            H2
                        </button>
                        <div className="w-px h-6 bg-gray-200" />
                        <button
                            onClick={() => insertMarkdown('bold')}
                            className="px-3 py-2 text-sm font-bold text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition-colors"
                            title="Bold"
                        >
                            B
                        </button>
                        <button
                            onClick={() => insertMarkdown('italic')}
                            className="px-3 py-2 text-sm italic text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition-colors"
                            title="Italic"
                        >
                            I
                        </button>
                        <button
                            onClick={() => insertMarkdown('code')}
                            className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition-colors"
                            title="Code"
                        >
                            {'</>'}
                        </button>
                        <div className="w-px h-6 bg-gray-200" />
                        <button
                            onClick={() => insertMarkdown('link')}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition-colors"
                            title="Link"
                        >
                            Link
                        </button>
                        <button
                            onClick={() => insertMarkdown('ul')}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-lime-50 hover:text-lime-600 rounded-lg transition-colors"
                            title="Bullet List"
                        >
                            • List
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportAsHTML}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Code className="w-4 h-4" />
                            HTML
                        </button>
                        <button
                            onClick={exportAsPDF}
                            className="px-4 py-2 text-sm font-medium text-white bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            PDF
                        </button>
                        <button
                            onClick={clearDraft}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Clear"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* Split View */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[700px]"
                >
                    {/* Editor */}
                    <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Editor
                            </h3>
                            <div className="text-xs text-gray-500">
                                {wordCount} words · {charCount} characters
                            </div>
                        </div>
                        <textarea
                            id="markdown-input"
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            className="flex-grow w-full p-6 resize-none outline-none font-mono text-sm"
                            placeholder="Type your markdown here..."
                        />
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Preview
                            </h3>
                        </div>
                        <div
                            id="markdown-preview"
                            className="flex-grow overflow-auto p-6 prose prose-sm max-w-none
                                prose-headings:text-gray-900
                                prose-p:text-gray-700
                                prose-a:text-lime-600 prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-gray-900
                                prose-code:text-lime-600 prose-code:bg-lime-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                                prose-pre:bg-gray-100 prose-pre:text-gray-800
                                prose-blockquote:border-lime-500 prose-blockquote:text-gray-600
                                prose-ul:text-gray-700
                                prose-ol:text-gray-700
                                prose-li:text-gray-700"
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {markdown}
                            </ReactMarkdown>
                        </div>
                    </div>
                </motion.div>

                {/* Auto-save indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-4 text-sm text-gray-500"
                >
                    <Save className="w-4 h-4 inline-block mr-1" />
                    Auto-saves every 5 seconds to your browser
                </motion.div>
            </div>
        </div>
    );
}
