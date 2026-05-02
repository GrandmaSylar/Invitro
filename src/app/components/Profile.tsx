import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useAuthStore } from "../../stores/useAuthStore";
import { rbacService } from "../../services/rbacService";

export function Profile() {
  const { user, login, resolvedPermissions, loginMethod } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.fullName || "");
      setEmail(user.email || "");
      setPhone(""); // Add phone to user model if needed, leaving empty for now
    }
  }, [user]);

  const [resultAlerts, setResultAlerts] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState(true);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await rbacService.updateUser(user.id, {
        fullName: displayName,
        email: email,
      });
      // Update local store so changes reflect immediately
      login({ ...user, fullName: displayName, email: email }, resolvedPermissions, loginMethod);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Preferences saved.");
  };

  return (
    <div className="p-8 space-y-6">
      {/* User Info Card */}
      <div className="bg-card rounded p-6 flex flex-col md:flex-row items-center md:items-start gap-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center shadow-lg">
          <span className="text-white text-3xl font-bold">{user?.fullName?.charAt(0).toUpperCase() || "U"}</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-foreground">{user?.fullName || "User Name"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-left">
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-semibold text-foreground capitalize">{user?.roleId || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="font-semibold text-foreground">{user?.username || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold text-foreground capitalize">{user?.status || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-semibold text-foreground break-all">{user?.email || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-card rounded p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-base font-bold text-foreground mb-6">Account Settings</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              type="submit"
              variant="green"
              className="mt-6 font-semibold py-2.5 px-6 w-full sm:w-auto"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-card rounded p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-base font-bold text-foreground mb-6">Notification Preferences</h3>
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Result Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when test results are ready</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={resultAlerts}
                  onChange={(e) => setResultAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">System Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts about system maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemNotifications}
                  onChange={(e) => setSystemNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Daily Summary Email</p>
                <p className="text-sm text-muted-foreground">Get a daily digest of all lab activities</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailySummary}
                  onChange={(e) => setDailySummary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Critical Result Alerts</p>
                <p className="text-sm text-muted-foreground">Immediate notifications for abnormal results</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalAlerts}
                  onChange={(e) => setCriticalAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <Button
              type="submit"
              variant="green"
              className="mt-6 font-semibold py-2.5 px-6 w-full sm:w-auto"
            >
              Save Preferences
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
