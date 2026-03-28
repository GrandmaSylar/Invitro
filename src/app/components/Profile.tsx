import { useState } from "react";
import { toast } from "sonner";

export function Profile() {
  const [displayName, setDisplayName] = useState("Aelita Poklonn");
  const [email, setEmail] = useState("a.poklonn@invitro.lab");
  const [phone, setPhone] = useState("+233 20 000 0000");

  const [resultAlerts, setResultAlerts] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated.");
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Preferences saved.");
  };

  return (
    <div className="p-8 space-y-6">
      {/* User Info Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white text-3xl font-bold">AP</span>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">Aelita Poklonn</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="font-semibold text-gray-800">Lab Technician</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="font-semibold text-gray-800">Biochemistry</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Employee ID</p>
              <p className="font-semibold text-gray-800">EMP-0042</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold text-gray-800">a.poklonn@invitro.lab</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6">Account Settings</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6">Notification Preferences</h3>
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Result Alerts</p>
                <p className="text-sm text-gray-500">Get notified when test results are ready</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={resultAlerts}
                  onChange={(e) => setResultAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">System Notifications</p>
                <p className="text-sm text-gray-500">Receive alerts about system maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemNotifications}
                  onChange={(e) => setSystemNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Daily Summary Email</p>
                <p className="text-sm text-gray-500">Get a daily digest of all lab activities</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailySummary}
                  onChange={(e) => setDailySummary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Critical Result Alerts</p>
                <p className="text-sm text-gray-500">Immediate notifications for abnormal results</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalAlerts}
                  onChange={(e) => setCriticalAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
            >
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
