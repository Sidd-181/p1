import ChatPanel from "@/components/dashboard/chat-panel";
import ConnectionsPanel from "@/components/dashboard/connection-panel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const styles = {
  shell: "app-shell-bg",
  userLabel: "mb-2 truncate px-1 text-sm text-muted-foreground",
  logoutBtn:
    "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
  logoutIcon: "size-4",
};

function DashboardPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [loggingOut, setLoggingout] = useState(false);

  const label = user?.email || user?.name || "Signed in User";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingout(true);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className={styles.shell}>
      <ChatPanel
        sessionToken={token}
        connections={<ConnectionsPanel sessionToken={token} />}
        footer={
          <>
            <div className={styles.userLabel}>{label}</div>
            <Button
              variant="ghost"
              className={styles.logoutBtn}
              disabled={loggingOut}
              onClick={() => handleLogout()}
            >
              <LogOut className={styles.logoutIcon} />
              {loggingOut ? "Logging out..." : "Log out"}
            </Button>
          </>
        }
      />
    </div>
  );
}

export default DashboardPage;
