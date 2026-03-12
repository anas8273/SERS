/**
 * usePortfolio - Hook لإدارة ملف الإنجاز عبر tRPC API
 * يستبدل localStorage بقاعدة بيانات حقيقية
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PortfolioState {
  id: number | null;
  saving: boolean;
  loading: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
}

export function usePortfolio(isAuthenticated: boolean = false) {
  const [state, setState] = useState<PortfolioState>({
    id: null,
    saving: false,
    loading: false,
    lastSaved: null,
    isDirty: false,
  });

  const utils = trpc.useUtils();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queries - فقط عندما يكون المستخدم مسجل دخول
  const portfolioList = trpc.portfolio.list.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  // Mutations
  const createMutation = trpc.portfolio.create.useMutation({
    onSuccess: (data) => {
      setState(prev => ({ ...prev, id: data.id, saving: false, lastSaved: new Date(), isDirty: false }));
      utils.portfolio.list.invalidate();
    },
    onError: () => {
      setState(prev => ({ ...prev, saving: false }));
    },
  });

  const updateMutation = trpc.portfolio.update.useMutation({
    onSuccess: () => {
      setState(prev => ({ ...prev, saving: false, lastSaved: new Date(), isDirty: false }));
    },
    onError: () => {
      setState(prev => ({ ...prev, saving: false }));
    },
  });

  const deleteMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => {
      setState(prev => ({ ...prev, id: null }));
      utils.portfolio.list.invalidate();
    },
  });

  const submitMutation = trpc.portfolio.submit.useMutation({
    onSuccess: () => {
      toast.success("تم تقديم ملف الإنجاز للمراجعة");
      utils.portfolio.list.invalidate();
    },
  });

  // File upload
  const uploadFileMutation = trpc.file.upload.useMutation();

  // Save portfolio - returns the portfolio id on success, or null on failure
  const savePortfolio = useCallback(async (data: {
    jobId: string;
    jobTitle: string;
    personalInfo: Record<string, string>;
    criteriaData: Record<string, any>;
    customCriteria?: any[];
    themeId?: string;
    completionPercentage?: number;
  }): Promise<number | null> => {
    setState(prev => ({ ...prev, saving: true }));
    try {
      if (state.id) {
        await updateMutation.mutateAsync({
          id: state.id,
          criteriaData: data.criteriaData,
          customCriteria: data.customCriteria,
          personalInfo: data.personalInfo,
          themeId: data.themeId,
          completionPercentage: data.completionPercentage,
        });
        return state.id;
      } else {
        const result = await createMutation.mutateAsync({
          jobId: data.jobId,
          jobTitle: data.jobTitle,
          personalInfo: data.personalInfo,
          criteriaData: data.criteriaData,
          customCriteria: data.customCriteria,
          themeId: data.themeId,
          completionPercentage: data.completionPercentage,
        });
        // Return the newly created id directly (state update is async)
        return result.id;
      }
    } catch {
      toast.error("فشل حفظ البيانات");
      return null;
    }
  }, [state.id, createMutation, updateMutation]);

  // Auto-save (debounced)
  const scheduleAutoSave = useCallback((data: Parameters<typeof savePortfolio>[0]) => {
    setState(prev => ({ ...prev, isDirty: true }));
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      savePortfolio(data);
    }, 5000); // Auto-save after 5 seconds of inactivity
  }, [savePortfolio]);

  // Upload file to S3
  const uploadFile = useCallback(async (file: File, portfolioId?: number, criterionId?: string, subEvidenceId?: string) => {
    return new Promise<{ id: number; url: string; fileKey: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const result = await uploadFileMutation.mutateAsync({
            portfolioId: portfolioId ?? state.id ?? undefined,
            fileName: file.name,
            mimeType: file.type,
            base64Data: base64,
            criterionId,
            subEvidenceId,
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, [state.id, uploadFileMutation]);

  // Load existing portfolio
  const loadPortfolio = useCallback((portfolioId: number) => {
    setState(prev => ({ ...prev, id: portfolioId, loading: false }));
  }, []);

  // Submit for review
  const submitForReview = useCallback(async () => {
    if (!state.id) return;
    await submitMutation.mutateAsync({ id: state.id });
  }, [state.id, submitMutation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  return {
    ...state,
    portfolioList: portfolioList.data ?? [],
    portfolioListLoading: portfolioList.isLoading,
    savePortfolio,
    scheduleAutoSave,
    uploadFile,
    loadPortfolio,
    submitForReview,
    deletePortfolio: deleteMutation.mutateAsync,
    isUploading: uploadFileMutation.isPending,
  };
}
