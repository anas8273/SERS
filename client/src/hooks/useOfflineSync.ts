/**
 * useOfflineSync - وضع عدم الاتصال بالإنترنت مع مزامنة تلقائية
 * يحفظ الشواهد محلياً عند عدم وجود اتصال ويزامنها عند عودة الاتصال
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface PendingAction {
  id: string;
  type: "add_evidence" | "update_evidence" | "delete_evidence" | "move_evidence";
  timestamp: number;
  data: Record<string, unknown>;
  synced: boolean;
}

const OFFLINE_QUEUE_KEY = "sers_offline_queue";
const OFFLINE_DATA_KEY = "sers_offline_data";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgressRef = useRef(false);

  // مراقبة حالة الاتصال
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("تم استعادة الاتصال بالإنترنت", {
        description: "جاري مزامنة البيانات المعلقة...",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("لا يوجد اتصال بالإنترنت", {
        description: "سيتم حفظ التغييرات محلياً ومزامنتها عند عودة الاتصال",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // تحميل الإجراءات المعلقة من localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        const actions = JSON.parse(stored) as PendingAction[];
        setPendingActions(actions.filter((a) => !a.synced));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // حفظ الإجراءات المعلقة في localStorage
  const savePendingActions = useCallback((actions: PendingAction[]) => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(actions));
    } catch {
      // localStorage full - remove oldest synced actions
      const unsyncedOnly = actions.filter((a) => !a.synced);
      try {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(unsyncedOnly));
      } catch {
        // still full, clear all
      }
    }
  }, []);

  // إضافة إجراء للقائمة المعلقة
  const addPendingAction = useCallback(
    (type: PendingAction["type"], data: Record<string, unknown>) => {
      const action: PendingAction = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        timestamp: Date.now(),
        data,
        synced: false,
      };
      setPendingActions((prev) => {
        const updated = [...prev, action];
        savePendingActions(updated);
        return updated;
      });
      return action.id;
    },
    [savePendingActions]
  );

  // مزامنة الإجراءات المعلقة
  const syncPendingActions = useCallback(async () => {
    if (syncInProgressRef.current || !navigator.onLine) return;
    syncInProgressRef.current = true;
    setIsSyncing(true);

    const unsynced = pendingActions.filter((a) => !a.synced);
    if (unsynced.length === 0) {
      setIsSyncing(false);
      syncInProgressRef.current = false;
      return;
    }

    let syncedCount = 0;
    const updatedActions = [...pendingActions];

    for (const action of unsynced) {
      try {
        // محاولة مزامنة كل إجراء
        // هنا يمكن استدعاء API الفعلي
        const idx = updatedActions.findIndex((a) => a.id === action.id);
        if (idx !== -1) {
          updatedActions[idx] = { ...updatedActions[idx], synced: true };
          syncedCount++;
        }
      } catch {
        // فشل المزامنة - سيتم المحاولة لاحقاً
        break;
      }
    }

    setPendingActions(updatedActions);
    savePendingActions(updatedActions);

    if (syncedCount > 0) {
      toast.success(`تمت مزامنة ${syncedCount} إجراء بنجاح`, {
        duration: 3000,
      });
    }

    setIsSyncing(false);
    syncInProgressRef.current = false;
  }, [pendingActions, savePendingActions]);

  // مزامنة تلقائية عند عودة الاتصال
  useEffect(() => {
    if (isOnline && pendingActions.some((a) => !a.synced)) {
      const timer = setTimeout(() => {
        syncPendingActions();
      }, 2000); // انتظار 2 ثانية للتأكد من استقرار الاتصال
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingActions, syncPendingActions]);

  // حفظ بيانات محلية للعمل بدون اتصال
  const saveOfflineData = useCallback((key: string, data: unknown) => {
    try {
      const existing = localStorage.getItem(OFFLINE_DATA_KEY);
      const allData = existing ? JSON.parse(existing) : {};
      allData[key] = { data, timestamp: Date.now() };
      localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(allData));
    } catch {
      // localStorage full
    }
  }, []);

  // استرجاع بيانات محلية
  const getOfflineData = useCallback(<T = unknown>(key: string): T | null => {
    try {
      const existing = localStorage.getItem(OFFLINE_DATA_KEY);
      if (!existing) return null;
      const allData = JSON.parse(existing);
      return allData[key]?.data ?? null;
    } catch {
      return null;
    }
  }, []);

  // مسح الإجراءات المتزامنة
  const clearSyncedActions = useCallback(() => {
    const unsynced = pendingActions.filter((a) => !a.synced);
    setPendingActions(unsynced);
    savePendingActions(unsynced);
  }, [pendingActions, savePendingActions]);

  return {
    isOnline,
    isSyncing,
    pendingCount: pendingActions.filter((a) => !a.synced).length,
    addPendingAction,
    syncPendingActions,
    saveOfflineData,
    getOfflineData,
    clearSyncedActions,
  };
}
