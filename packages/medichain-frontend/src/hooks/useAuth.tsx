import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { UserProfile, UserRole } from "../types";
import { connectWallet } from "../utils/medichainContract";

interface AuthContextType {
  user: UserProfile | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  connect: (role?: UserRole) => Promise<void>;
  disconnect: () => void;
  setDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo profiles for each role
const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  admin: { address: "0x71C0...4921", name: "Dr. Sarah Chen", role: "admin" },
  doctor: { address: "0x71C0...4921", name: "Dr. Sarah Chen", role: "doctor" },
  nurse: { address: "0x3a9F...B712", name: "Nurse Aiko Tanaka", role: "nurse" },
  pharmacist: {
    address: "0x92D1...C403",
    name: "Ph. Marcus Webb",
    role: "pharmacist",
  },
  patient: {
    address: "0xF8e2...9A01",
    name: "James Hartwell",
    role: "patient",
  },
  auditor: { address: "0x55B3...E890", name: "Lisa Ndong", role: "auditor" },
  researcher: {
    address: "0x7C21...D612",
    name: "Dr. Kenji Mori",
    role: "researcher",
  },
  emergency: {
    address: "0xAA10...FF33",
    name: "EMT Override",
    role: "emergency",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async (role: UserRole = "doctor") => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      const profile = DEMO_PROFILES[role];

      setUser({
        ...profile,
        address,
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setUser(null);
  }, []);

  const setDemoRole = useCallback((role: UserRole) => {
    setUser(DEMO_PROFILES[role]);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isConnecting,
        isAuthenticated: !!user,
        connect,
        disconnect,
        setDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
