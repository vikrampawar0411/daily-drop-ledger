import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

export function NotificationDropdown() {
  const { notifications, loading, markAsRead } = useNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative border border-transparent hover:border-gray-300 focus:border-gray-400 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="p-2 font-semibold text-sm border-b">Notifications</div>
        {loading ? (
          <div className="p-4 text-center text-muted-foreground text-xs">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-xs">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-2 text-sm cursor-pointer ${n.is_read ? "bg-white" : "bg-blue-50"}`}
              onClick={() => markAsRead(n.id)}
            >
              <div className="font-medium mb-1">{n.type.replace(/_/g, " ")}</div>
              <div>{n.message}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
