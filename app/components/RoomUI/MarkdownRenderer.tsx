'use client';

import React, { useMemo, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { emojify } from '@/app/lib/utils/message/helpers';

export interface MarkdownRendererProps {
	content: string;
	className?: string;
	isMyMessage?: boolean;
	showThemeSelector?: boolean;
	onThemeSelectorClose?: () => void;
}

const MAX_LENGTH = 500;

const THEMES = [
	{ id: 'github-dark', name: 'GitHub Dark' },
	{ id: 'atom-one-dark', name: 'One Dark' },
	{ id: 'monokai', name: 'Monokai' },
	{ id: 'vs2015', name: 'VS 2015' },
] as const;

const createMarkdownComponents = (): Components => ({
	h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h1 className="text-3xl font-bold mt-6 mb-4 text-neutral-100" {...props}>
			{children}
		</h1>
	),
	h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h2 className="text-2xl font-bold mt-5 mb-3 text-neutral-100" {...props}>
			{children}
		</h2>
	),
	h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h3 className="text-xl font-bold mt-4 mb-2 text-neutral-100" {...props}>
			{children}
		</h3>
	),
	p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
		<p className="mb-4 leading-relaxed" {...props}>
			{children}
		</p>
	),
	ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
		<ul className="list-disc list-inside mb-4 text-neutral-300 space-y-1" {...props}>
			{children}
		</ul>
	),
	ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
		<ol className="list-decimal list-inside mb-4 text-neutral-300 space-y-1" {...props}>
			{children}
		</ol>
	),
	li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
		<li className="ml-4" {...props}>
			{children}
		</li>
	),
	blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
		<blockquote
			className="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-neutral-400 bg-neutral-800 rounded-r"
			{...props}
		>
			{children}
		</blockquote>
	),
	code: ({
		children,
		className,
		...props
	}: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
		const isInline = !className;
		return isInline ? (
			<code className="text-blue-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
				{children}
			</code>
		) : (
			<code className={`text-sm ${className || ''}`} {...props}>
				{children}
			</code>
		);
	},
	pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
		<pre className="rounded-lg overflow-x-auto mb-4" {...props}>
			{children}
		</pre>
	),
	table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
		<div className="overflow-x-auto mb-4">
			<table className="min-w-full border-collapse border border-neutral-700" {...props}>
				{children}
			</table>
		</div>
	),
	thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
		<thead className="bg-neutral-800" {...props}>
			{children}
		</thead>
	),
	th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
		<th className="border border-neutral-700 px-4 py-2 text-left font-semibold" {...props}>
			{children}
		</th>
	),
	td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
		<td className="border border-neutral-700 px-4 py-2" {...props}>
			{children}
		</td>
	),
	a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a className="text-blue-400 hover:text-blue-300 underline" {...props}>
			{children}
		</a>
	),
	hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
		<hr className="my-6 border-neutral-700" {...props} />
	),
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
	content,
	className = '',
	showThemeSelector = false,
	onThemeSelectorClose,
}) => {
	const [expanded, setExpanded] = useState(false);
	const [theme, setTheme] = useState('atom-one-dark');

	const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);

	// ✅ FIXED: Correct plugin order - rehypeRaw and rehypeSanitize BEFORE rehypeHighlight and rehypeKatex
	const rehypePlugins = useMemo(
		() => [rehypeRaw, rehypeSanitize, rehypeHighlight, rehypeKatex],
		[]
	);

	const markdownComponents = useMemo(() => createMarkdownComponents(), []);
	const processed = useMemo(() => emojify(content ?? ''), [content]);

	const needsTruncate = processed.length > MAX_LENGTH;
	const shown = needsTruncate && !expanded ? processed.slice(0, MAX_LENGTH) + '...' : processed;

	const handleThemeChange = (newTheme: string) => {
		setTheme(newTheme);
		const link = document.getElementById('highlight-theme') as HTMLLinkElement | null;
		if (link) {
			link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${newTheme}.min.css`;
		}
		onThemeSelectorClose?.();
	};

	if (!content || !content.trim()) return null;

	return (
		<div className={`markdown-renderer relative ${className}`}>
			<link
				id="highlight-theme"
				rel="stylesheet"
				href={`https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${theme}.min.css`}
			/>

			{showThemeSelector && (
				<div className="absolute -bottom-14 left-2 transform z-[150] animate-slide-up  duration-200">
					<div className="w-25 overflow-y-auto bg-white rounded-lg shadow-md border border-neutral-200">
						{THEMES.map((t) => (
							<button
								key={t.id}
								onClick={() => handleThemeChange(t.id)}
								className={`w-full px-2 py-0.75 text-left text-sm transition-colors ${
									theme === t.id
										? 'bg-blue-50 text-blue-700 font-medium'
										: 'hover:bg-neutral-50 text-neutral-900'
								}`}
								type="button"
							>
								{t.name}
							</button>
						))}
					</div>
				</div>
			)}

			<div className="break-words">
				<ReactMarkdown
					remarkPlugins={remarkPlugins}
					rehypePlugins={rehypePlugins}
					components={markdownComponents}
				>
					{shown}
				</ReactMarkdown>
			</div>

			{needsTruncate && (
				<button
					onClick={() => setExpanded((s) => !s)}
					className="mt-2 text-xs underline underline-offset-2 hover:opacity-80 transition-opacity"
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
