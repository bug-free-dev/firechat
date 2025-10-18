'use client';

import 'katex/dist/katex.min.css';

import React, { useMemo, useState } from 'react';
import { AnchorHTMLAttributes, HTMLAttributes, ImgHTMLAttributes } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

export interface MarkdownRendererProps {
	content: string;
	className?: string;
	compact?: boolean;
}

const MAX_LENGTH = 500;

function AnchorRenderer(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
	const { href, children, ...rest } = props;
	const isExternal = href?.startsWith('http') || href?.startsWith('//');

	return (
		<a
			href={href}
			target={isExternal ? '_blank' : undefined}
			rel={isExternal ? 'noopener noreferrer' : undefined}
			{...rest}
			className="text-cyan-600 hover:underline break-words"
		>
			{children}
		</a>
	);
}

function ParagraphRenderer(props: HTMLAttributes<HTMLParagraphElement>) {
	return <p {...props} className="my-0.5 leading-snug break-words" />;
}

function ImageRenderer(props: ImgHTMLAttributes<HTMLImageElement>) {
	const [loading, setLoading] = React.useState(true);
	const [errored, setErrored] = React.useState(false);

	const { src, alt, ...rest } = props;

	if (!src || errored) return null;

	return (
		<div className="relative w-full my-1 rounded overflow-hidden max-h-[250px] bg-neutral-50">
			{loading && (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-4 h-4 border border-neutral-300 border-t-cyan-500 rounded-full animate-spin" />
				</div>
			)}

			<img
				src={src}
				alt={alt}
				{...rest}
				onLoad={() => setLoading(false)}
				onError={() => setErrored(true)}
				className="rounded object-cover w-full h-auto max-h-[250px]"
				style={{ opacity: loading ? 0 : 1 }}
			/>
		</div>
	);
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const components: Components = useMemo(
		() => ({
			a: AnchorRenderer,
			img: ImageRenderer,
			p: ParagraphRenderer,
		}),
		[]
	);

	if (!content?.trim()) return null;

	const shouldTruncate = content.length > MAX_LENGTH && !isExpanded;
	const displayContent = shouldTruncate ? content.slice(0, MAX_LENGTH) + '…' : content;

	return (
		<div className="relative">
			<div
				className={`prose prose-neutral prose-sm max-w-full text-sm ${className || ''}`}
				style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
			>
				<ReactMarkdown
					remarkPlugins={[remarkGfm, remarkMath]}
					rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeSanitize]}
					components={components}
				>
					{displayContent}
				</ReactMarkdown>
			</div>

			{content.length > MAX_LENGTH && (
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="mt-0.5 text-xs text-cyan-600 hover:underline font-medium"
				>
					{isExpanded ? 'Show less' : 'Show more'}
				</button>
			)}
		</div>
	);
};

export default MarkdownRenderer;
