import React, { useRef, useEffect } from 'react';
import TerminalWindow from './TerminalWindow';
import { LogMessage } from '../types';

interface SystemLogProps {
  logs: LogMessage[];
}

const SystemLog: React.FC<SystemLogProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <TerminalWindow title="시스템 로그">
      <div className="h-[120px] overflow-y-auto text-sm">
        <ul ref={logContainerRef}>
          {logs.map((log, index) => {
            let statusColor = 'text-green-400';
            if (log.status === '경고') statusColor = 'text-yellow-400';
            if (log.status === '정보') statusColor = 'text-blue-400';
            if (log.status === '거래') statusColor = 'text-cyan-400';
            if (log.status === 'AI 거래') statusColor = 'text-orange-400';
            if (log.status === '주문') statusColor = 'text-fuchsia-400';
            if (log.status === '이벤트') statusColor = 'text-purple-400';

            return (
              <li key={index} className="flex">
                <span className="text-green-400/60 mr-2">[{log.time}]</span>
                <span className="flex-grow">{log.msg}</span>
                <span className={`${statusColor} font-bold`}>[{log.status}]</span>
              </li>
            );
          })}
        </ul>
      </div>
    </TerminalWindow>
  );
};

export default SystemLog;