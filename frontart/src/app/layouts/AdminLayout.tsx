import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, Store as StoreIcon, Image as ImageIcon, ShoppingBag, Layers, Palette, CreditCard, PieChart, FileText, Settings, HelpCircle, LogOut } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
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
        <div className="flex flex-col h-screen bg-[#fcfcfc]">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden lg:flex w-72 flex-col border-r border-white/5 bg-[#1a1a1a] h-full shadow-2xl z-20 transition-all duration-300">
                    <div className="p-8 border-b border-white/5 bg-[#1a1a1a]">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-[#a73f2b] to-[#b30452] shadow-lg shadow-[#b30452]/20">
                                <LayoutDashboard className="w-5 h-5 text-white" />
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Admin Panel</span>
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        {menuItems.map((section, idx) => (
                            <div key={idx} className="px-4 mb-6">
                                {section.title && (
                                    <h4 className="text-[10px] font-bold text-gray-500 mb-4 px-4 tracking-[0.2em] uppercase">
                                        {section.title}
                                    </h4>
                                )}
                                <div className="space-y-1.5 px-2">
                                    {section.items.map((item) => {
                                        const isActive = currentPath === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNavigate(item.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden",
                                                    isActive
                                                        ? "text-white shadow-lg shadow-[#b30452]/25"
                                                        : "text-gray-400 hover:text-white hover:bg-[#b30452]/15"
                                                )}
                                            >
                                                {/* Active background gradient */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTab"
                                                        className="absolute inset-0 bg-gradient-to-r from-[#a73f2b] to-[#b30452] z-0"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                )}
                                                <item.icon className={cn(
                                                    "w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110",
                                                    isActive ? "text-white" : "text-gray-500 group-hover:text-white"
                                                )} />
                                                <span className="relative z-10">{item.label}</span>
                                                {isActive && (
                                                    <motion.div
                                                        className="absolute right-0 w-1 h-6 bg-white rounded-l-full z-10"
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-white/5 bg-[#1a1a1a]">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-4 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl px-4 py-6 transition-all duration-300 group"
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                        >
                            <LogOut className="w-5 h-5 transition-transform group-hover:rotate-12" />
                            <span className="font-semibold text-sm">Logout Session</span>
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
