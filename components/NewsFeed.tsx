import React, { useRef, useEffect } from 'react';
import TerminalWindow from './TerminalWindow';
import { LogMessage } from '../types';

interface NewsFeedProps {
  news: LogMessage[];
}

const NewsFeed: React.FC<NewsFeedProps> = ({ news }) => {
  const feedContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTop = feedContainerRef.current.scrollHeight;
    }
  }, [news]);

  return (
    <TerminalWindow title="뉴스 피드">
      <div className="h-[120px] overflow-y-auto text-sm">
        {news.length > 0 ? (
          <ul ref={feedContainerRef}>
            {news.map((item, index) => (
              <li key={index} className="flex mb-1">
                <span className="text-green-400/60 mr-2">[{item.time}]</span>
                <span className="flex-grow text-purple-400">{item.msg}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full text-green-500/70">
            수신된 시장 뉴스가 없습니다.
          </div>
        )}
      </div>
    </TerminalWindow>
  );
};

export default NewsFeed;
