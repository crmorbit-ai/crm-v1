import React from 'react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '../../lib/utils';

const TooltipButton = ({
  onClick,
  children,
  className = '',
  disabled = false,
  tooltipText = "You don't have access",
  type = "button",
  variant = "default",
  size = "default",
  ...props
}) => {
  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button
                type={type}
                variant={variant}
                size={size}
                className={cn(className, "pointer-events-none")}
                disabled={true}
                {...props}
              >
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
};

export default TooltipButton;
