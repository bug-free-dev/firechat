import { AnchorHTMLAttributes, HTMLAttributes } from 'react';
import type { Components } from 'react-markdown';

import { emojify as libEmojify } from '@/app/lib/utils/message/helpers';

import { HIGHLIGHT_LINK_ID } from '../constants';

/**
 * Sets or updates the highlight.js theme stylesheet
 */
export function setHighlightTheme(themeId: string): void {
	if (typeof document === 'undefined') return;

	const link = document.getElementById(HIGHLIGHT_LINK_ID) as HTMLLinkElement | null;
	const href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${themeId}.min.css`;

	if (link) {
		link.href = href;
	} else {
		const newLink = document.createElement('link');
		newLink.id = HIGHLIGHT_LINK_ID;
		newLink.rel = 'stylesheet';
		newLink.href = href;
		document.head.appendChild(newLink);
	}
}

/**
 * Initializes the highlight.js theme on mount
 */
export function initHighlightTheme(themeId: string): void {
	if (typeof document === 'undefined') return;

	const existingLink = document.getElementById(HIGHLIGHT_LINK_ID);
	if (!existingLink) {
		setHighlightTheme(themeId);
	}
}

/**
 * Expose an emojify wrapper
 */
export function emojify(input: string): string {
	return libEmojify(input);
}

/**
 * Create ReactMarkdown components mapping - NO COLOR MANIPULATION
 * Colors are managed by parent MsgBubble component
 */
export const createMarkdownComponents = (): Components => ({
	h1: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
		<h1 className="text-2xl font-bold mt-4 mb-3 leading-tight" {...props}>
			{children}
		</h1>
	),
	h2: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
		<h2 className="text-xl font-bold mt-3 mb-2 leading-snug" {...props}>
			{children}
		</h2>
	),
	h3: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
		<h3 className="text-lg font-semibold mt-3 mb-2 leading-normal" {...props}>
			{children}
		</h3>
	),
	h4: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
		<h4 className="text-base font-semibold mt-2 mb-1.5" {...props}>
			{children}
		</h4>
	),
	h5: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
		<h5 className="text-sm font-semibold mt-2 mb-1" {...props}>
			{children}
		</h5>
	),
	h6: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
		<h6 className="text-xs font-semibold mt-2 mb-1 uppercase tracking-wide opacity-70" {...props}>
			{children}
		</h6>
	),
	p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
		<p className="leading-relaxed mb-3" {...props}>
			{children}
		</p>
	),
	ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
		<ul className="list-disc list-outside ml-2 space-y-1 mb-3" {...props}>
			{children}
		</ul>
	),
	ol: ({ children, ...props }: HTMLAttributes<HTMLOListElement>) => (
		<ol className="list-decimal list-outside ml-2 space-y-1 mb-3" {...props}>
			{children}
		</ol>
	),
	li: ({ children, ...props }: HTMLAttributes<HTMLLIElement>) => (
		<li className="leading-relaxed" {...props}>
			{children}
		</li>
	),
	blockquote: ({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) => (
		<blockquote
			className="border-l-4 border-sky-400 pl-4 pr-3 py-2 my-3 italic rounded-r bg-sky-500/10"
			{...props}
		>
			{children}
		</blockquote>
	),
	table: ({ children, ...props }: HTMLAttributes<HTMLTableElement>) => (
		<table className="w-full border-collapse border border-neutral-300" {...props}>
			{children}
		</table>
	),

	thead: ({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
		<thead className=" border-b border-neutral-500" {...props}>
			{children}
		</thead>
	),

	tbody: ({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
		<tbody className="divide-y divide-neutral-500" {...props}>
			{children}
		</tbody>
	),

	tr: ({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
		<tr className="hover:bg-neutral-50 transition-colors" {...props}>
			{children}
		</tr>
	),

	th: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
		<th
			className="px-4 py-2 text-left text-sm font-semibold border border-neutral-500"
			{...props}
		>
			{children}
		</th>
	),

	td: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
		<td className="px-4 py-2 text-sm border border-neutral-500" {...props}>
			{children}
		</td>
	),

	hr: ({ ...props }: HTMLAttributes<HTMLHRElement>) => (
		<hr className="border-t border-neutral-500 my-4" {...props} />
	),

	a: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a
			className="underline underline-offset-2 hover:opacity-70 transition-opacity font-medium text-sky"
			href={href}
			target={href?.startsWith('http') ? '_blank' : undefined}
			rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
			{...props}
		>
			{children}
		</a>
	),
	strong: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
		<strong className="font-bold" {...props}>
			{children}
		</strong>
	),
	em: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
		<em className="italic" {...props}>
			{children}
		</em>
	),
	del: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
		<del className="line-through opacity-60" {...props}>
			{children}
		</del>
	),
	pre: ({ children, ...props }: HTMLAttributes<HTMLPreElement>) => (
		<pre className="overflow-x-auto my-3 rounded-lg p-1 text-sm leading-relaxed" {...props}>
			{children}
		</pre>
	),
	code: ({ children, className, ...props }: HTMLAttributes<HTMLElement>) => {
		const isInline = !className || !className.includes('language-');

		if (isInline) {
			return (
				<code
					className="px-1.5 py-0.5 rounded font-mono text-sm bg-neutral-100 text-neutral-700"
					{...props}
				>
					{children}
				</code>
			);
		}

		return (
			<code className={`font-mono text-sm rounded-lg ${className || ''}`} {...props}>
				{children}
			</code>
		);
	},
});

/**
 * Process markdown content (emojify, etc.)
 */
export function processContent(raw?: string | null): string {
	const s = String(raw ?? '');
	return emojify(s);
}
