import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Sidebar() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  if (isMobile) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-16 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src="https://image.tmdb.org/t/p/original/ooqASvA7qxlTVKL3KwOzBwy57Dh.jpg" 
              alt="Ranger Logo"
            />
          </Avatar>
          {!collapsed && <span className="font-semibold">Ranger</span>}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <nav className="p-2 space-y-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer",
                "hover:bg-accent hover:text-accent-foreground",
                location === link.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                collapsed && "justify-center"
              )}
            >
              <link.icon className="h-5 w-5" />
              {!collapsed && <span>{link.label}</span>}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}