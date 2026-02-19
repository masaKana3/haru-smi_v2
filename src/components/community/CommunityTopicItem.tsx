import React from 'react';
import { CommunityTopic } from '../../types/community';

type Props = {
  topic: CommunityTopic;
  onClick: (topicId: string) => void;
};

export default function CommunityTopicItem({ topic, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(topic.id)}
      className="w-full text-left p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors flex items-center justify-between"
    >
      <span className="text-sm font-semibold text-brandText">{topic.title}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-brandMuted">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
