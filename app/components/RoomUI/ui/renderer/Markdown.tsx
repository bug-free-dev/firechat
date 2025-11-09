'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import {
	createMarkdownComponents,
	initHighlightTheme,
	processContent,
	setHighlightTheme,
} from '@/app/components/RoomUI/utils/markdown';

import { MAX_LENGTH } from '../../constants';
import { InlineMdThemePicker } from '../blocks/';

export interface MarkdownProps {
	content: string;
	className?: string;
	initialTheme?: string;
	showThemeSelector?: boolean;
}

const Markdown: React.FC<MarkdownProps> = memo(function Markdown({
	content,
	className = '',
	initialTheme = 'atom-one-dark',
	showThemeSelector = false,
}) {
	const [expanded, setExpanded] = useState(false);
	const [theme, setTheme] = useState(initialTheme);

	const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
	const rehypePlugins = useMemo(
		() => [rehypeRaw, rehypeSanitize, rehypeHighlight, rehypeKatex],
		[]
	);
	const components = useMemo(() => createMarkdownComponents(), []);
	const processed = useMemo(() => processContent(content), [content]);

	const needsTruncate = processed.length > MAX_LENGTH;
	const shown = needsTruncate && !expanded ? processed.slice(0, MAX_LENGTH) + '...' : processed;

	const handleThemeChange = (newTheme: string) => {
		setTheme(newTheme);
		setHighlightTheme(newTheme);
	};

	useEffect(() => {
		initHighlightTheme(initialTheme);
	}, [initialTheme]);

	useEffect(() => {
		setHighlightTheme(theme);
	}, [theme]);

	if (!content?.trim()) return null;

	return (
		<div className={`markdown-renderer relative ${className}`}>
			<div className="break-words overflow-hidden z-0">
				<ReactMarkdown
					remarkPlugins={remarkPlugins}
					rehypePlugins={rehypePlugins}
					components={components}
				>
					{shown}
				</ReactMarkdown>
			</div>

			{needsTruncate && (
				<button
					onClick={() => setExpanded((prev) => !prev)}
					className="mt-3 text-xs hover:text-neutral-500 font-medium transition-colors"
					type="button"
					aria-expanded={expanded}
					aria-label={expanded ? 'Show less content' : 'Show more content'}
				>
					{expanded ? 'Show less' : 'Show more'}
				</button>
			)}

			{/* Theme picker at the bottom */}
			{showThemeSelector && (
				<div className="mt-4 w-full flex justify-center">
					<InlineMdThemePicker
						activeTheme={theme}
						onChange={handleThemeChange}
						isVisible={showThemeSelector}
					/>
				</div>
			)}
		</div>
	);
});

export default Markdown;
