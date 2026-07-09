import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Menu, User, KeyRound, LogOut, ChevronDown } from 'lucide-react';
import { API_URL } from '../../config/api.config';
import NotificationBell from '../notifications/NotificationBell';
import LifetimeLicenseBadge from '../LifetimeLicenseBadge';

const Header = ({ title, actionButton, onMenuClick, isMobile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Debug: Check if lastLogin exists
  React.useEffect(() => {
    if (user) {
      console.log('Header user object:', user);
      console.log('Has lastLogin?', !!user.lastLogin);
      console.log('lastLogin value:', user.lastLogin);
    }
  }, [user]);

  const getInitials = () => {
    if (!user) return '??';
    const firstInitial = user.firstName ? user.firstName[0] : '';
    const lastInitial = user.lastName ? user.lastName[0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  const getTenantLogoUrl = () => {
    const logo = user?.tenant?.logo;
    if (!logo) return null;
    if (logo.startsWith('http') || logo.startsWith('data:')) return logo;
    const base = API_URL.replace(/\/api$/, '');
    return `${base}${logo}`;
  };

  const tenantLogoUrl = getTenantLogoUrl();

  return (
    <header className="h-16 bg-background border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 overflow-hidden">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="flex-shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg md:text-xl font-semibold text-foreground truncate max-w-xs md:max-w-sm">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {actionButton && !isMobile && (
          <div className="flex-shrink-0">{actionButton}</div>
        )}

        {/* Lifetime License Badge */}
        <LifetimeLicenseBadge />

        {/* Last Login - Mobile & Desktop */}
        {user?.lastLogin && (
          <div
            className="items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-muted rounded-lg text-xs"
            style={{
              display: 'flex',
              minWidth: isMobile ? '100px' : '140px',
              flexShrink: 0
            }}
          >
            <span style={{ flexShrink: 0, fontSize: isMobile ? '12px' : '14px' }}>🕐</span>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0
            }}>
              <span
                className="text-muted-foreground"
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: isMobile ? '9px' : '11px',
                  lineHeight: 1.2
                }}
              >
                {isMobile ? 'Login' : 'Last Login'}
              </span>
              <span
                className="font-medium text-foreground"
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: isMobile ? '9px' : '11px',
                  lineHeight: 1.2
                }}
              >
                {new Date(user.lastLogin).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        )}

        {/* Notification - Second */}
        <NotificationBell />

        {/* Profile - Third */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                {tenantLogoUrl && (
                  <AvatarImage src={tenantLogoUrl} alt={user?.tenant?.organizationName || 'Logo'} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
                <div className="text-left hidden sm:block" style={{ maxWidth: '140px' }}>
                  <p className="text-sm font-medium leading-none truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
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
