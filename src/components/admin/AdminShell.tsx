"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BsGraphUpArrow } from "react-icons/bs";
import {
  FiShoppingCart,
  FiList,
  FiPlus,
  FiImage,
  FiTag,
  FiSettings,
  FiPercent,
  FiLock,
  FiUsers,
  FiBox,
  FiVideo,
  FiInstagram,
  FiLayout,
  FiCheckCircle,
  FiBell,
  FiSearch,
  FiLogOut,
  FiPieChart,
  FiFileText,
  FiTarget,
  FiActivity,
  FiMenu,
  FiPocket,
  FiServer,
} from "react-icons/fi";
import { SiSublimetext } from "react-icons/si";
import { FcRules } from "react-icons/fc";
import { LuUsers } from "react-icons/lu";
import { RiAdminLine } from "react-icons/ri";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useDispatch, useSelector } from "react-redux";
import { logoutApi } from "@/lib/features/auth";
import { Button } from "@/components/ui/button";
import { MdVideoLibrary } from "react-icons/md";
import NotificationDropdown from "@/components/admin/NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ✅ Lazy load POS Modal for performance
const POSModal = lazy(() => import("@/components/admin/POSModal"));

// ✅ Import Admin PWA Components
import OfflineWarningAdmin from "@/components/admin/OfflineWarningAdmin";
import InstallPromptAdmin from "@/components/admin/InstallPromptAdmin";
import UpdateNotificationAdmin from "@/components/admin/UpdateNotificationAdmin";

function AdminShell({ children }) {
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsible state
  const dispatch = useDispatch<any>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPOSModal, setShowPOSModal] = useState(false); // ✅ POS Modal state
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);

  const handleLogout = async () => {
    try {
      const { payload } = await dispatch(logoutApi());
      if (payload.success) {
        router.push("/login/admin");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const navigationGroups = useMemo(() => [
    {
      group: "POS System",
      items: [
        ...(process.env.NEXT_PUBLIC_ENABLE_POS === "true"
          ? [
            {
              href: "#",
              title: "POS Terminal",
              icon: <FiPocket />,
              roles: ["SuperAdmin", "Admin", "Sales person"],
              onClick: () => setShowPOSModal(true),
            },
            {
              href: "/admin/pos-orders",
              title: "POS Orders",
              icon: <FiFileText />,
              roles: ["SuperAdmin", "Admin", "Sales person"],
            },
          ]
          : []),
      ]
    },
    {
      group: "Operations",
      items: [
        {
          href: "/admin/get-orders",
          title: "All Orders",
          icon: <FiShoppingCart />,
          roles: ["SuperAdmin", "Admin", "Sales person"],
        },
        ...(process.env.NEXT_PUBLIC_ENABLE_ADMIN_OFFLINE_ORDERS === "true"
          ? [
            {
              href: "/admin/offline-order",
              title: "Offline Order",
              icon: <FiPlus />,
              roles: ["SuperAdmin", "Admin", "Sales person"],
            },
          ]
          : []),
        {
          href: "/admin/gst-settings",
          title: "GST Settings",
          icon: <FiPercent />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/inventory",
          title: "Inventory",
          icon: <FiBox />,
          roles: ["SuperAdmin", "Admin", "Sales person"],
        },
      ]
    },
    {
      group: "Users",
      items: [
        {
          href: "/admin/customers",
          title: "All Customers",
          icon: <FiUsers />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/roles",
          title: "Management",
          icon: <RiAdminLine />,
          roles: ["SuperAdmin"],
        },
      ]
    },
    {
      group: "Store Front",
      items: [
        {
          href: "/admin/hero-banner",
          title: "Hero Banner",
          icon: <FiImage />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/categories",
          title: "Categories",
          icon: <FiLayout />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/products",
          title: "Products",
          icon: <FiList />,
          roles: ["SuperAdmin", "Admin", "Sales person"],
        },
        {
          href: "/admin/coupon",
          title: "Coupons",
          icon: <FiTag />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/rules",
          title: "Rules",
          icon: <FcRules />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/imageText",
          title: "Image Text",
          icon: <SiSublimetext />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/videomanagement",
          title: "Add Video",
          icon: <FiVideo />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/marquee",
          title: "Marquee",
          icon: <FiActivity />,
          roles: ["SuperAdmin", "Admin"],
        },
        {
          href: "/admin/instagram",
          title: "Instagram",
          icon: <FiInstagram />,
          roles: ["SuperAdmin", "Admin"],
        },
      ]
    }
  ], []);

  const filteredGroups = useMemo(() => {
    if (!user || !user.role) return [];
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(user.role))
    })).filter(group => group.items.length > 0);
  }, [user.role, navigationGroups]);

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    // Expand groups that have an active item
    const groupsToExpand = filteredGroups
      .filter(group => group.items.some(item => pathname === item.href))
      .map(group => group.group);

    setExpandedGroups(prev => Array.from(new Set([...prev, ...groupsToExpand])));
  }, [pathname, filteredGroups]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      let href = "/" + segments.slice(0, index + 1).join("/");
      // Fix: First segment 'admin' should point to dashboard
      if (segment === "admin") href = "/admin/dashboard";
      // Custom mapping for better titles
      let title = segment.replace(/-/g, " ");
      if (segment === "admin") title = "Dashboard";
      if (segment === "get-orders") title = "All Orders";
      if (segment === "offline-order") title = "Offline Order";
      if (segment === "pos-orders") title = "POS Orders";
      if (segment === "gst-settings") title = "GST Settings";
      if (segment === "roles") title = "Management";
      if (segment === "videomanagement") title = "Videos";
      if (segment === "imageText") title = "Image Text";

      return { title, href };
    });
  }, [pathname]);

  // ✅ Redirect if no user/role found (lost state)
  const isAuth = user && user.role;

  useEffect(() => {
    if (!isAuth) {
      router.push("/login/admin");
    }
  }, [isAuth, router]);

  // ✅ Register Admin Service Worker (only after authentication)
  useEffect(() => {
    if (!isAuth) return; // Only register if admin is authenticated

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker scoped to /admin/
      navigator.serviceWorker
        .register("/sw-admin.js", { scope: "/admin/" })
        .then((registration) => {
          console.log("[Admin PWA] Service worker registered:", registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error("[Admin PWA] Service worker registration failed:", error);
        });
    }
  }, [isAuth]);

  if (!isAuth) {
    return null;
  }

  return (
    <>
      <OfflineWarningAdmin />
      <InstallPromptAdmin />
      <UpdateNotificationAdmin />

      <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
        <style jsx global>{`
        .navbar-main,
        .footer-main {
          display: none;
        }
        .header-main {
          display: none;
        }
      `}</style>
        {/* Mobile Overlay */}
        {showSidebar && (
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-500
            ${showSidebar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          `}
            onClick={() => setShowSidebar(false)}
          ></div>
        )}

        {/* Hamburger Menu (Mobile Only - when closed) */}
        {!showSidebar && (
          <div className="fixed top-6 left-6 z-50 md:hidden cursor-pointer bg-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-2xl text-black border border-gray-100">
            <FiMenu onClick={() => setShowSidebar(true)} size={24} />
          </div>
        )}

        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 h-screen bg-white shadow-[8px_0_32px_rgba(124,29,62,0.03)] border-r border-gray-100 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-50
          ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static ${isCollapsed ? "w-24" : "w-72"}`}
        >
          <div
            className={`pl-8 flex justify-between items-center h-24 ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            <div className="flex items-center gap-4 overflow-hidden">
              {!isCollapsed && (
                <img src="/assets/static/logo/saw.svg" alt="Saw" className="h-14 w-auto ml-2 overflow-hidden" />
              )}
            </div>
          </div>

          <nav className="flex-1 mt-4 px-4 pb-20 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none hover:scrollbar-thin">
            <div className={`px-2 mb-4 ${isCollapsed ? 'hidden' : ''}`}>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 ml-4">Workspace Navigation</p>
            </div>

            {/* Standalone Dashboard at top */}
            <Link
              href="/admin/dashboard"
              className={`flex items-center group relative px-4 py-3 text-sm rounded-2xl transition-all duration-300 mb-2
              ${pathname === "/admin/dashboard"
                  ? "bg-[#7C1D3E] text-white shadow-xl shadow-[#7C1D3E]/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                } ${isCollapsed ? "justify-center" : ""}
            `}
            >
              <span className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 
              ${pathname === "/admin/dashboard" ? "text-white" : "text-gray-400 group-hover:text-[#7C1D3E]"}
            `}>
                <FiPieChart size={18} />
              </span>
              {!isCollapsed && (
                <span className="ml-4 truncate tracking-wide uppercase text-[10px] font-bold">
                  Dashboards
                </span>
              )}
            </Link>

            {filteredGroups.map((group, groupIndex) => {
              const isExpanded = expandedGroups.includes(group.group);
              const hasActiveItem = group.items.some(item => pathname === item.href);

              return (
                <div key={groupIndex} className="space-y-1">
                  {/* Group Header */}
                  {!isCollapsed ? (
                    <button
                      onClick={() => toggleGroup(group.group)}
                      className={`w-full flex items-center justify-between px-4 py-2 mt-4 mb-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl
                      ${hasActiveItem ? 'text-[#7C1D3E] bg-[#7C1D3E]/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                    `}
                    >
                      <span>{group.group}</span>
                      <ChevronRight
                        size={12}
                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                  ) : (
                    <div className="h-px bg-gray-50 my-4 mx-4" />
                  )}

                  {/* Group Items */}
                  {(isExpanded || isCollapsed) && (
                    <div className="relative ml-8 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {/* Vertical Rail Line */}
                      {!isCollapsed && (
                        <div className="absolute left-[-16px] top-0 bottom-6 w-[1px] bg-gray-100/50" />
                      )}

                      {/* Active Rail Highlight */}
                      {!isCollapsed && hasActiveItem && (
                        <div className="absolute left-[-16px] top-0 bottom-6 w-[1.5px] bg-gradient-to-b from-[#7C1D3E]/30 via-[#7C1D3E]/60 to-[#7C1D3E]/30 animate-in fade-in duration-500" />
                      )}

                      {group.items.map((card, itemIndex) => {
                        const isActive = pathname === card.href;

                        const itemContent = (
                          <>
                            <span className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 
                            ${isActive ? "text-white" : "text-gray-400 group-hover:text-[#7C1D3E]"}
                          `}>
                              {card.icon && React.cloneElement(card.icon as React.ReactElement, { size: 16 })}
                            </span>
                            {!isCollapsed && (
                              <span className={`ml-4 truncate tracking-wide uppercase text-[10px] font-bold transition-colors
                              ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"}
                            `}>
                                {card.title}
                              </span>
                            )}
                          </>
                        );

                        if (card.onClick) {
                          return (
                            <button
                              key={itemIndex}
                              onClick={() => {
                                card.onClick?.();
                                if (window.innerWidth < 768) setShowSidebar(false);
                              }}
                              className={`w-full flex items-center group relative px-4 py-3 text-sm rounded-2xl transition-all duration-300
                              ${isActive
                                  ? "bg-[#7C1D3E] text-white shadow-xl shadow-[#7C1D3E]/20"
                                  : "hover:bg-gray-50/50 text-gray-500"
                                } ${isCollapsed ? "justify-center" : ""}
                            `}
                              title={isCollapsed ? card.title : ""}
                            >
                              {itemContent}
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={itemIndex}
                            href={card.href}
                            className={`flex items-center group relative px-4 py-3 text-sm rounded-2xl transition-all duration-300
                            ${isActive
                                ? "bg-[#7C1D3E] text-white shadow-xl shadow-[#7C1D3E]/20"
                                : "hover:bg-gray-50/50 text-gray-500"
                              } ${isCollapsed ? "justify-center" : ""}
                          `}
                            onClick={() => {
                              if (window.innerWidth < 768) setShowSidebar(false);
                            }}
                            title={isCollapsed ? card.title : ""}
                          >
                            {itemContent}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={`p-6 bg-white border-t border-gray-50 ${isCollapsed ? "px-2 text-center" : ""}`}>
            <Link
              href="https://www.webgeon.com/"
              target="_blank"
              className={`flex items-center gap-2 transition-all group ${isCollapsed ? "justify-center" : ""}`}
            >
              {isCollapsed ? (
                <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">W</span>
              ) : (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Powered By</span>
                  <span className="text-xs font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 group-hover:from-[#7C1D3E] group-hover:to-pink-600">WEBGEON RESULTS</span>
                </div>
              )}
            </Link>
          </div>
        </aside>

        <ConfirmationModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
        />

        {/* ✅ POS Modal (Lazy Loaded) */}
        {showPOSModal && (
          <Suspense fallback={<div>Loading POS...</div>}>
            <POSModal isOpen={showPOSModal} onClose={() => setShowPOSModal(false)} />
          </Suspense>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Header */}
          <header className="bg-white/70 backdrop-blur-2xl border-b border-gray-100/50 p-6 sticky top-0 z-30 flex justify-between items-center h-24">
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setShowSidebar(!showSidebar);
                  } else {
                    setIsCollapsed(!isCollapsed);
                  }
                }}
                className="w-12 h-12 rounded-2xl bg-gray-50 hover:bg-[#7C1D3E]/10 hover:text-[#7C1D3E] text-gray-400 transition-all flex items-center justify-center border border-transparent hover:border-[#7C1D3E]/20"
              >
                {isCollapsed ? <ChevronRight size={22} /> : <FiMenu size={22} />}
              </button>
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                  <FiServer className="text-gray-400" size={14} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Environment: Prod</span>
                </div>
                <ChevronRight size={14} className="text-gray-200" />
                <nav className="flex items-center gap-2 text-sm font-black tracking-tight" aria-label="Breadcrumb">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      <Link
                        href={crumb.href}
                        className={`capitalize transition-colors ${idx === breadcrumbs.length - 1 ? 'text-gray-900' : 'text-gray-400 hover:text-[#7C1D3E]'}`}
                      >
                        {crumb.title}
                      </Link>
                      {idx < breadcrumbs.length - 1 && (
                        <span className="text-gray-200">/</span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <NotificationDropdown />
              </div>
              <div className="h-10 w-px bg-gray-100 mx-1 hidden sm:block"></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 cursor-pointer group">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                          <p className="text-sm font-black text-gray-900 leading-none group-hover:text-[#7C1D3E] transition-colors">{user.name}</p>
                          <p className="text-[10px] text-[#7C1D3E] font-black tracking-widest uppercase mt-1.5 opacity-80">{user.role}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C1D3E] to-[#E91E7B] flex items-center justify-center text-white font-black text-lg shadow-xl shadow-brand/20 border-4 border-white ring-1 ring-gray-100 transition-transform group-hover:scale-105">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl border-gray-100 shadow-2xl p-2 z-[60]">
                      <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-50" />
                      <DropdownMenuItem
                        onClick={() => router.push("/admin/settings/2fa")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FiLock size={16} />
                        </div>
                        <span className="text-xs font-bold">2FA Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                          <FiLogOut size={16} />
                        </div>
                        <span className="text-xs font-bold">Log Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-thin">
            <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default AdminShell;
