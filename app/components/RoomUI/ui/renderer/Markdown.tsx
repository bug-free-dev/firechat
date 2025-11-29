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
	isDark?: boolean;
}

const Markdown: React.FC<MarkdownProps> = memo(function Markdown({
	content,
	className = '',
	initialTheme = 'atom-one-dark',
	showThemeSelector = false,
	isDark = false,
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
			<div className="break-words overflow-hidden w-full">
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
					className={`mt-3 text-xs font-medium transition-colors underline decoration-dashed underline-offset-4 md:no-underline md:hover:underline md:decoration-solid ${
						isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
					}`}
					type="button"
					aria-expanded={expanded}
					aria-label={expanded ? 'Show less content' : 'Show more content'}
				>
					{expanded ? 'Show less' : 'Show more'}
				</button>
			)}

			<div
				className={`overflow-hidden transition-all duration-300 ease-in-out ${
					showThemeSelector ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
				}`}
			>
				<div className="w-full flex justify-center">
					<InlineMdThemePicker
						activeTheme={theme}
						onChange={handleThemeChange}
						isVisible={showThemeSelector}
					/>
				</div>
			</div>
		</div>
	);
});

export default Markdown;
