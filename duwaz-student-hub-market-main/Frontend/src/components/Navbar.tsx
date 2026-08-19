import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, LogOut, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useShopContext } from '@/context/ShopContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  onCartClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCartClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { hasShops, isLoadingShop, clearShops } = useShopContext();
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    clearShops();
    logout();
    navigate('/');
  };

  // The nav link to show for shop management — hidden for admins
  const shopNavItem = isAuthenticated && !isAdmin
    ? isLoadingShop
      ? null
      : hasShops
        ? <NavLink to="/my-shops">Manage Shops</NavLink>
        : <NavLink to="/create-shop">Create Shop</NavLink>
    : !isAuthenticated
      ? <NavLink to="/create-shop">Create Shop</NavLink>
      : null;

  const shopMobileItem = isAuthenticated && !isAdmin
    ? isLoadingShop
      ? null
      : hasShops
        ? <MobileNavLink to="/my-shops" onClick={toggleMobileMenu}>Manage Shops</MobileNavLink>
        : <MobileNavLink to="/create-shop" onClick={toggleMobileMenu}>Create Shop</MobileNavLink>
    : !isAuthenticated
      ? <MobileNavLink to="/create-shop" onClick={toggleMobileMenu}>Create Shop</MobileNavLink>
      : null;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold text-duwaz-brown">Duwaz.</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/marketplace">Marketplace</NavLink>
          {shopNavItem}
          <NavLink to="/about">About</NavLink>
        </nav>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onCartClick} className="relative">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-duwaz-brown text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full p-0 h-9 w-9 overflow-hidden">
                  <Avatar className="h-9 w-9">
                    {user?.profileImage && (
                      <AvatarImage src={user.profileImage} alt={user.studentName} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-duwaz-brown text-white text-sm font-semibold">
                      {user?.studentName
                        ? user.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.studentName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/account">My Account</Link>
                </DropdownMenuItem>
                {!isAdmin && !isLoadingShop && (
                  hasShops ? (
                    <DropdownMenuItem asChild>
                      <Link to="/my-shops">
                        <Store className="mr-2 h-4 w-4" />
                        Manage Shops
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link to="/create-shop">
                        <Store className="mr-2 h-4 w-4" />
                        Create Shop
                      </Link>
                    </DropdownMenuItem>
                  )
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" className="bg-duwaz-brown hover:bg-duwaz-brown/90">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <Button variant="ghost" size="icon" onClick={onCartClick} className="mr-2 relative">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-duwaz-brown text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          'md:hidden absolute w-full bg-white shadow-lg transition-all duration-300 ease-in-out',
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        )}
      >
        <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
          <MobileNavLink to="/" onClick={toggleMobileMenu}>Home</MobileNavLink>
          <MobileNavLink to="/marketplace" onClick={toggleMobileMenu}>Marketplace</MobileNavLink>
          {shopMobileItem}
          <MobileNavLink to="/about" onClick={toggleMobileMenu}>About</MobileNavLink>
          {isAuthenticated ? (
            <>
              <MobileNavLink to="/account" onClick={toggleMobileMenu}>My Account</MobileNavLink>
              <button
                onClick={() => { handleLogout(); toggleMobileMenu(); }}
                className="text-duwaz-black hover:text-duwaz-brown transition-colors block py-2 font-medium text-left"
              >
                Sign Out
              </button>
            </>
          ) : (
            <MobileNavLink to="/login" onClick={toggleMobileMenu}>Sign In</MobileNavLink>
          )}
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children }) => (
  <Link to={to} className="text-duwaz-black hover:text-duwaz-brown transition-colors font-medium">
    {children}
  </Link>
);

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, onClick, children }) => (
  <Link
    to={to}
    className="text-duwaz-black hover:text-duwaz-brown transition-colors block py-2 font-medium"
    onClick={onClick}
  >
    {children}
  </Link>
);

export default Navbar;
