import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Menu, User, KeyRound, LogOut, ChevronDown } from 'lucide-react';

const Header = ({ title, actionButton, onMenuClick, isMobile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getInitials = () => {
    if (!user) return '??';
    const firstInitial = user.firstName ? user.firstName[0] : '';
    const lastInitial = user.lastName ? user.lastName[0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <header className="h-16 bg-background border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {actionButton && !isMobile && (
          <div>{actionButton}</div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.userType?.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isMobile && (
              <>
                <DropdownMenuLabel>
                  <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {user?.userType?.replace(/_/g, ' ')}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/change-password')}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
