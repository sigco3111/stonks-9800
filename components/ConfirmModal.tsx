
import React from 'react';
import TerminalWindow from './TerminalWindow';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 crt-scanlines" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <TerminalWindow title={title} className="w-full max-w-md">
        <p id="confirm-modal-title" className="text-xl text-yellow-400 mb-4">{message}</p>
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onCancel}
            aria-label="Cancel action"
            className="px-4 py-2 border-2 border-green-500/50 text-green-400 hover:bg-green-500/20"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            aria-label="Confirm action"
            className="px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold"
          >
            확인
          </button>
        </div>
      </TerminalWindow>
    </div>
  );
};

export default ConfirmModal;
