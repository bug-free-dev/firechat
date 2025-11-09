import { useMemo } from 'react';

import { GROUP_TIME_MS } from '@/app/components/RoomUI/constants';
import { ChatMessage } from '@/app/lib/types';
import { toMillis } from '@/app/lib/utils/time';

export interface GroupedMessage {
	message: ChatMessage;
	showAvatar: boolean;
	showTimestamp: boolean;
	replyToMessage?: ChatMessage;
}

export const useMessageGroup = (messages: ChatMessage[], messagesMap: Map<string, ChatMessage>) => {
	return useMemo<GroupedMessage[]>(() => {
		const out: GroupedMessage[] = [];

		for (let i = 0; i < messages.length; i++) {
			const msg = messages[i];
			const prev = messages[i - 1];
			const next = messages[i + 1];

			const msgTime = toMillis(msg.createdAt);
			const prevTime = prev ? toMillis(prev.createdAt) : 0;
			const nextTime = next ? toMillis(next.createdAt) : 0;

			const showAvatar =
				!prev || prev.sender !== msg.sender || msgTime - prevTime > GROUP_TIME_MS;
			const showTimestamp =
				!next || next.sender !== msg.sender || nextTime - msgTime > GROUP_TIME_MS;

			const replyToMessage = msg.replyTo ? messagesMap.get(msg.replyTo) : undefined;

			out.push({ message: msg, showAvatar, showTimestamp, replyToMessage });
		}

		return out;
	}, [messages, messagesMap]);
};
