import React from 'react';
import '../../styles/crm.css';

const TooltipButton = ({
  onClick,
  children,
  className = '',
  disabled = false,
  tooltipText = "You don't have access",
  type = "button",
  ...props
}) => {
  if (disabled) {
    return (
      <div className="crm-tooltip">
        <button
          type={type}
          className={`${className} disabled`}
          disabled={true}
          {...props}
        >
          {children}
        </button>
        <span className="crm-tooltip-text">{tooltipText}</span>
      </div>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

export default TooltipButton;
