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
}

const MAX_LENGTH = 500;

const CodeRenderer: Components['code'] = ({ className, children }) => {
	return (
		<pre className="max-w-70 max-h-70 scroll overflow-auto rounded-lg p-3 text-sm leading-snug bg-neutral-900/90 text-neutral-100">
			<code className={className ?? ''}>{children}</code>
		</pre>
	);
};

const components: Components = {
	code: CodeRenderer,
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
	const [expanded, setExpanded] = useState(false);

	// apply emojify once per content change
	const processed = useMemo(() => emojify(content ?? ''), [content]);

	const needsTruncate = processed.length > MAX_LENGTH;
	const shown = needsTruncate && !expanded ? processed.slice(0, MAX_LENGTH) + '...' : processed;

	if (!content || !content.trim()) return null;

	return (
		<div className={`markdown-renderer ${className}`}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkMath]}
				rehypePlugins={[rehypeHighlight, rehypeKatex, rehypeSanitize, rehypeRaw]}
				components={components}
			>
				{shown}
			</ReactMarkdown>

			{needsTruncate && (
				<button
					onClick={() => setExpanded((s) => !s)}
					className="mt-1 text-xs underline underline-offset-2 hover:opacity-80"
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
