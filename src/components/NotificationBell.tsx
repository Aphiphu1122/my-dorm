"use client";

import { useState, useEffect } from "react";
import { RiNotification3Line, RiNotification3Fill } from "react-icons/ri";

type Notification = {
  id: string;
  message: string;
  createdAt: string;
};

type NotificationBellProps = {
  notifications: Notification[];
  hasNew: boolean;
  onClearNotifications: () => void;
};

export default function NotificationBell({
  notifications,
  hasNew,
  onClearNotifications,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("#notification-bell") && !target.closest("#notification-dropdown")) {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" id="notification-bell">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-3xl p-3 rounded-full hover:bg-gradient-to-r hover:from-yellow-400 hover:to-yellow-300 focus:outline-none  focus:ring-yellow-400 transition-transform active:scale-95"
        aria-label="Toggle notifications"
        title={hasNew ? "You have new notifications" : "No new notifications"}
      >
        {hasNew ? (
          <RiNotification3Fill className="text-gray-300 drop-shadow-md" />
        ) : (
          <RiNotification3Line className="text-gray-500" />
        )}
        {hasNew && (
          <span className="absolute top-2 right-2 block w-4 h-4 bg-yellow-400 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {/* Dropdown */}
      <div
        id="notification-dropdown"
        className={`absolute right-0 mt-3 w-80 bg-gradient-to-br from-white to-yellow-50 border border-yellow-200 rounded-xl shadow-2xl z-50
          transform transition-all duration-300 origin-top-right
          ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
        `}
      >
        <div className="flex items-center justify-between p-5 border-b border-yellow-200 text-yellow-900 font-bold text-lg">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <button
              onClick={() => {
                onClearNotifications();
                setOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 active:scale-95 transition-transform text-white px-3 py-1 rounded-full text-sm shadow-md"
              aria-label="Clear all notifications"
              title="Clear all notifications"
            >
              Clear All
            </button>
          )}
        </div>

        <ul className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-300 scrollbar-track-yellow-100">
          {notifications.length > 0 ? (
            notifications.map((noti) => (
              <li
                key={noti.id}
                className="flex items-start space-x-4 px-6 py-4 border-b border-yellow-200 hover:bg-yellow-100 transition cursor-pointer rounded-lg"
                title={noti.message}
              >
                <div className="flex-shrink-0 bg-yellow-400 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-md select-none">
                  📢
                </div>
                <div className="flex flex-col">
                  <p className="text-yellow-900 font-semibold text-sm truncate max-w-[250px]">
                    {noti.message}
                  </p>
                  <span className="text-yellow-600 text-xs mt-1">
                    {new Date(noti.createdAt).toLocaleString("th-TH", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="p-6 text-center text-yellow-400 font-medium">No notifications</li>
          )}
        </ul>
      </div>
    </div>
  );
}