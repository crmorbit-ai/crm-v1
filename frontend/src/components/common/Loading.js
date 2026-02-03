import React from 'react';

const Loading = ({ message = 'Loading...', fullScreen = true }) => {
  const content = (
    <div className="text-center">
      {/* Animated Logo/Spinner */}
      <div className="relative inline-block">
        <div
          className="w-16 h-16 rounded-full border-4 border-gray-200"
          style={{
            borderTopColor: '#4A90E2',
            animation: 'spin 1s linear infinite'
          }}
        />
        <div
          className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent"
          style={{
            borderRightColor: '#2c5364',
            animation: 'spin 1.5s linear infinite reverse'
          }}
        />
      </div>

      {/* Loading text with pulse animation */}
      <p
        className="mt-4 text-sm font-medium text-gray-600"
        style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
      >
        {message}
      </p>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full"
            style={{
              animation: 'bounce 1s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-6px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
};

export default Loading;
