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
    className="relative text-3xl p-3 rounded-full focus:outline-none transition-transform active:scale-95
               hover:scale-105 hover:shadow-lg"
    aria-label="Toggle notifications"
    title={hasNew ? "You have new notifications" : "No new notifications"}
  >
    {/* Icon */}
    {hasNew ? (
      <RiNotification3Fill className="text-blue-600 drop-shadow-md transition-colors duration-300" />
    ) : (
      <RiNotification3Line className="text-gray-500 transition-colors duration-300" />
    )}

    {/* Pulse Indicator */}
    {hasNew && (
      <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white animate-ping"></span>
    )}
  </button>

  {/* Dropdown */}
  <div
    id="notification-dropdown"
    className={`absolute right-0 mt-3 w-96 bg-white/90 backdrop-blur-lg border border-gray-300 rounded-2xl shadow-2xl z-50
      transform transition-all duration-300 origin-top-right
      ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
    `}
  >
    <div className="flex items-center justify-between p-5 border-b border-gray-200 text-gray-800 font-bold text-lg">
      <span>Notifications</span>
      {notifications.length > 0 && (
        <button
          onClick={() => {
            onClearNotifications();
            setOpen(false);
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-sm shadow-md transition-transform active:scale-95"
        >
          Clear All
        </button>
      )}
    </div>

    <ul className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100 p-2">
      {notifications.length > 0 ? (
        notifications.map((noti) => (
          <li
            key={noti.id}
            className="flex items-start space-x-4 p-4 mb-2 bg-gray-50/80 rounded-xl shadow-sm hover:bg-gray-100 transition cursor-pointer"
          >
            <div className="flex flex-col">
              <p className="text-gray-900 font-medium text-sm truncate max-w-[260px]">
                {noti.message}
              </p>
              <span className="text-gray-500 text-xs mt-1">
                {new Date(noti.createdAt).toLocaleString("th-TH", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </li>
        ))
      ) : (
        <li className="p-6 text-center text-gray-400 font-medium">No notifications</li>
      )}
    </ul>
  </div>
</div>




  );
}