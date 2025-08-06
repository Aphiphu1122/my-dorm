"use client";

import { useState } from "react";
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

export default function NotificationBell({ notifications, hasNew, onClearNotifications }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

   return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative text-2xl">
        {hasNew ? <RiNotification3Fill className="text-red-600" /> : <RiNotification3Line />}
        {hasNew && (
          <span className="absolute top-0 right-0 block w-2 h-2 bg-red-600 rounded-full"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg border rounded-lg z-50">
          <div className="flex items-center justify-between p-2 border-b text-sm font-semibold text-gray-700">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={onClearNotifications}
                className="text-xs text-red-500 hover:underline"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <ul className="max-h-60 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((noti) => (
                <li key={noti.id} className="p-3 text-sm border-b last:border-b-0 text-gray-800">
                  📢 {noti.message}
                  <div className="text-xs text-gray-500">
                    {new Date(noti.createdAt).toLocaleString("th-TH")}
                  </div>
                </li>
              ))
            ) : (
              <li className="p-3 text-sm text-gray-500 text-center">ไม่มีการแจ้งเตือน</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
