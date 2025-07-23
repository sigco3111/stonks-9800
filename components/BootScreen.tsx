
import React, { useState, useEffect } from 'react';

const bootLines = [
  'STONKS-9800 BIOS v2.17 (c) 1998 SIGCO 산업',
  '초기화 중...',
  '메모리 확인: 640KB 정상',
  'CPU 감지 중... MegaChip 8086 @ 4.77MHz',
  '저장소 감지 중... HDC-10 20MB',
  'STONKS-NET에 연결 중...',
  'DHCP 요청... 정상',
  'IP 주소: 192.168.1.100',
  '시장 데이터 스트림 동기화 중... 보안 연결 설정됨.',
  'GUI 로딩 중...',
];

const BlinkingCursor: React.FC = () => {
    return <span className="bg-green-400 w-3 h-5 inline-block animate-ping ml-1"></span>
}

const BootScreen: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    bootLines.forEach((line, index) => {
      setTimeout(() => {
        setLines(prev => [...prev, line]);
        if (index === bootLines.length - 1) {
            setTimeout(() => setShowCursor(false), 500);
        }
      }, index * 400);
    });
  }, []);

  return (
    <div className="w-full h-screen p-8 text-xl md:text-2xl flex flex-col justify-center items-start">
      <div>
        {lines.map((line, i) => (
          <p key={i}>&gt; {line}</p>
        ))}
        {showCursor && <p>&gt; <BlinkingCursor/></p>}
      </div>
    </div>
  );
};

export default BootScreen;