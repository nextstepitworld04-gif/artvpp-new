import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, Store as StoreIcon, Image as ImageIcon, ShoppingBag, Layers, Palette, CreditCard, PieChart, FileText, Settings, HelpCircle, LogOut } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { Header } from '../components/Header';

export function AdminLayout() {
    const { user, logout } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    // Mapping current path to active section ID
    const currentPath = location.pathname.split('/').pop() || 'overview';

    const menuItems = [
        {
            title: 'OVERVIEW',
            items: [
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            ]
        },
        {
            title: 'MANAGEMENT',
            items: [
                { id: 'vendors', label: 'Sellers / Vendors', icon: StoreIcon },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'artworks', label: 'Artworks', icon: ImageIcon },
                { id: 'orders', label: 'Orders', icon: ShoppingBag },
            ]
        },
        {
            title: 'DISCOVER & SERVICES',
            items: [
                { id: 'categories', label: 'Categories', icon: Layers },
                { id: 'services', label: 'Services', icon: Palette },
            ]
        },
        {
            title: 'FINANCE',
            items: [
                { id: 'revenue', label: 'Revenue & Commission', icon: CreditCard },
                { id: 'reports', label: 'Reports & Analytics', icon: PieChart },
            ]
        },
        {
            title: 'PLATFORM',
            items: [
                { id: 'content', label: 'Content Management', icon: FileText },
                { id: 'settings', label: 'Platform Settings', icon: Settings },
                { id: 'support', label: 'Support Tickets', icon: HelpCircle },
            ]
        }
    ];

    const handleNavigate = (id: string) => {
        navigate(`/dashboard/admin/${id}`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                {/* Admin Sidebar */}
                <aside className="hidden lg:flex w-64 flex-col border-r bg-white h-full">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <LayoutDashboard className="w-6 h-6 text-[#a73f2b]" />
                            Admin Panel
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        {menuItems.map((section, idx) => (
                            <div key={idx} className="px-4 mb-6">
                                {section.title && (
                                    <h4 className="text-xs font-semibold text-gray-400 mb-3 px-2 tracking-wider">
                                        {section.title}
                                    </h4>
                                )}
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = currentPath === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNavigate(item.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                                    isActive
                                                        ? "bg-[#a73f2b]/10 text-[#a73f2b]"
                                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                )}
                                            >
                                                <item.icon className={cn("w-4 h-4", isActive ? "text-[#a73f2b]" : "text-gray-400")} />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </Button>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
