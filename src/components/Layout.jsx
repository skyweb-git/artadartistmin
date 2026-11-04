import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, Package, Calendar, Settings, Menu, X, ImageIcon, Palette, LogOut, User, Megaphone, FileText, Mail, MapPin, CreditCard, Armchair, Ticket, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
const logo = '/logo.png';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/artists', icon: Palette, label: 'Artists' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/gallery', icon: ImageIcon, label: 'Gallery' },
    { path: '/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/forms', icon: FileText, label: 'Forms' },
    { path: '/subscribers', icon: Mail, label: 'Banner Subscribers' },
    { path: '/art-district', icon: MapPin, label: 'ArtDistrict' },
    { path: '/seating', icon: Armchair, label: 'Seating Arrangement' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/ecommerce', icon: ShoppingBag, label: 'E-Commerce' },
    { path: '/coupons', icon: Ticket, label: 'Coupons' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:shadow-none flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
            <div className="flex items-center">
              <img src={logo} alt="ArtArtist" className="w-10 h-10 object-cover" />
              <span className="ml-3 text-xl font-bold text-gray-900">ArtArtist Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="mt-8 px-4 flex-1 overflow-y-auto">
            <div className="space-y-2 pb-8">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${isActive ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-red-600" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.displayName || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'admin@artlove.com'}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
