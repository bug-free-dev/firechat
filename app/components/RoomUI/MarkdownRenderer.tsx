'use client';

import 'katex/dist/katex.min.css';

import React, { useMemo, useState } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { emojify } from '@/app/lib/utils/message/helpers';

export interface MarkdownRendererProps {
	content: string;
	className?: string;
	isMyMessage?: boolean;
}

const MAX_LENGTH = 400;

const CodeRenderer: Components['code'] = ({ className, children, node }) => {
	const [copied, setCopied] = useState(false);
	const codeString = String(children).replace(/\n$/, '');
	const isInline = !node?.position || node.position.start.line === node.position.end.line;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(codeString);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (isInline) {
		return (
			<code className="px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-100 text-[0.9em] font-mono">
				{children}
			</code>
		);
	}

	return (
		<div className="relative group my-3 rounded-lg overflow-hidden ring-1 ring-neutral-700/70 bg-neutral-900">
			<div className="flex items-center justify-between px-3 py-2 bg-neutral-800/50 text-xs text-neutral-400">
				<span className="font-mono">{className?.replace('language-', '') || 'code'}</span>
				<button
					onClick={handleCopy}
					className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-700/50 text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:ring-offset-2 focus:ring-offset-neutral-900"
					aria-label="Copy code"
				>
					{copied ? (
						<>
							<FiCheck className="w-3.5 h-3.5" />
							<span>Copied</span>
						</>
					) : (
						<>
							<FiCopy className="w-3.5 h-3.5" />
							<span>Copy</span>
						</>
					)}
				</button>
			</div>
			<div className="max-h-96 overflow-auto">
				<pre className="p-4 text-sm leading-relaxed">
					<code className={className ?? ''}>{children}</code>
				</pre>
			</div>
		</div>
	);
};

const components: Components = {
	code: CodeRenderer,
	pre: ({ children }) => <>{children}</>,
	p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
	ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
	ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
	li: ({ children }) => <li className="leading-relaxed">{children}</li>,
	a: ({ href, children }) => (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-sky-500/70 hover:text-sky-600/70 underline underline-offset-2 transition-colors"
		>
			{children}
		</a>
	),
	blockquote: ({ children }) => (
		<blockquote className="pl-3 py-1 my-2 border-l-3 border-neutral-300/70 text-neutral-600/70 italic">
			{children}
		</blockquote>
	),
	h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
	h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
	h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2 first:mt-0">{children}</h3>,
	table: ({ children }) => (
		<div className="overflow-x-auto my-3">
			<table className="min-w-full divide-y divide-neutral-200/70">{children}</table>
		</div>
	),
	thead: ({ children }) => <thead className="bg-neutral-50/70">{children}</thead>,
	th: ({ children }) => (
		<th className="px-3 py-2 text-left text-xs font-medium text-neutral-600/70">{children}</th>
	),
	td: ({ children }) => <td className="px-3 py-2 text-sm">{children}</td>,
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
	const [expanded, setExpanded] = useState(false);

	const processed = useMemo(() => emojify(content ?? ''), [content]);

	const needsTruncate = processed.length > MAX_LENGTH;
	const shown = needsTruncate && !expanded ? processed.slice(0, MAX_LENGTH) + '...' : processed;

	if (!content || !content.trim()) return null;

	return (
		<div className={`markdown-renderer break-words ${className}`}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkMath]}
				rehypePlugins={[rehypeHighlight, rehypeKatex, rehypeSanitize]}
				components={components}
			>
				{shown}
			</ReactMarkdown>

			{needsTruncate && (
				<button
					onClick={() => setExpanded((s) => !s)}
					className="mt-2 text-xs font-medium px-2 py-1 rounded-md ring-1 ring-sky-200/70 bg-sky-50/50 hover:bg-sky-100/70 text-sky-600/70 transition-all duration-200 focus:outline-none focus:ring-sky-400/70 focus:ring-offset-2"
					type="button"
					aria-expanded={expanded}
				>
					{expanded ? 'Show less' : 'Show more'}
				</button>
			)}
		</div>
	);
};

export default MarkdownRenderer;
