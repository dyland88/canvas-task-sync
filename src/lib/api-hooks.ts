import { api } from "~/trpc/react";

/**
 * Real API integration functions to replace the mock implementations in the components.
 * These functions use the tRPC client to make actual API calls to the backend.
 */

// Authentication functions
export const useGoogleAuth = () => {
  const getAuthUrlMutation = api.auth.getGoogleAuthUrl.useQuery();
  const authenticateMutation = api.auth.authenticateWithGoogle.useMutation();
  const getCurrentUserQuery = api.auth.getCurrentUser.useQuery;
  const logoutMutation = api.auth.logout.useMutation();

  const initiateGoogleLogin = () => {
    if (getAuthUrlMutation.data?.url) {
      window.location.href = getAuthUrlMutation.data.url;
    }
  };

  const completeGoogleAuth = async (code: string) => {
    return await authenticateMutation.mutateAsync({ code });
  };

  const logout = async (userId: string) => {
    return await logoutMutation.mutateAsync({ userId });
  };

  return {
    initiateGoogleLogin,
    completeGoogleAuth,
    getCurrentUser: getCurrentUserQuery,
    logout,
    isLoadingAuthUrl: getAuthUrlMutation.isLoading,
    authUrl: getAuthUrlMutation.data?.url,
  };
};

// Canvas functions
export const useCanvas = () => {
  const validateUrlMutation = api.canvas.validateUrl.useMutation();
  const getAssignmentsQuery = api.canvas.getAssignments.useQuery;
  const createIntegrationMutation = api.canvas.createIntegration.useMutation();
  const getUserIntegrationsQuery = api.canvas.getUserIntegrations.useQuery;
  const updateIntegrationMutation = api.canvas.updateIntegration.useMutation();
  const deleteIntegrationMutation = api.canvas.deleteIntegration.useMutation();

  const validateCanvasUrl = async (url: string) => {
    return await validateUrlMutation.mutateAsync({ url });
  };

  const getAssignments = (url: string, userId: string) => {
    return getAssignmentsQuery({ url, userId });
  };

  const createIntegration = async (data: {
    userId: string;
    canvasUrl: string;
    taskListId: string;
    taskListName: string;
  }) => {
    return await createIntegrationMutation.mutateAsync(data);
  };

  const getUserIntegrations = (userId: string) => {
    return getUserIntegrationsQuery({ userId });
  };

  const updateIntegration = async (data: {
    integrationId: string;
    userId: string;
    canvasUrl?: string;
    taskListId?: string;
    taskListName?: string;
    isActive?: boolean;
  }) => {
    return await updateIntegrationMutation.mutateAsync(data);
  };

  const deleteIntegration = async (integrationId: string, userId: string) => {
    return await deleteIntegrationMutation.mutateAsync({
      integrationId,
      userId,
    });
  };

  return {
    validateCanvasUrl,
    getAssignments,
    createIntegration,
    getUserIntegrations,
    updateIntegration,
    deleteIntegration,
    isValidatingUrl: validateUrlMutation.isPending,
  };
};

// Google Tasks functions
export const useGoogleTasks = () => {
  const getTaskListsQuery = api.tasks.getTaskLists.useQuery;
  const createTaskListMutation = api.tasks.createTaskList.useMutation();
  const getTasksQuery = api.tasks.getTasks.useQuery;
  const getSyncedTasksQuery = api.tasks.getSyncedTasks.useQuery;
  const getSyncLogsQuery = api.tasks.getSyncLogs.useQuery;

  const getTaskLists = (userId: string) => {
    return getTaskListsQuery({ userId });
  };

  const createTaskList = async (userId: string, title: string) => {
    return await createTaskListMutation.mutateAsync({ userId, title });
  };

  const getTasks = (userId: string, taskListId: string) => {
    return getTasksQuery({ userId, taskListId });
  };

  const getSyncedTasks = (userId: string, integrationId?: string) => {
    return getSyncedTasksQuery({ userId, integrationId });
  };

  const getSyncLogs = (userId: string, limit?: number) => {
    return getSyncLogsQuery({ userId, limit });
  };

  return {
    getTaskLists,
    createTaskList,
    getTasks,
    getSyncedTasks,
    getSyncLogs,
    isCreatingTaskList: createTaskListMutation.isPending,
  };
};

// Sync functions
export const useSync = () => {
  const syncUserMutation = api.sync.syncUser.useMutation();
  const syncIntegrationMutation = api.sync.syncIntegration.useMutation();
  const getSyncStatusQuery = api.sync.getSyncStatus.useQuery;
  const getLastSyncTimeQuery = api.sync.getLastSyncTime.useQuery;

  const syncUser = async (userId: string) => {
    return await syncUserMutation.mutateAsync({ userId });
  };

  const syncIntegration = async (userId: string, integrationId: string) => {
    return await syncIntegrationMutation.mutateAsync({ userId, integrationId });
  };

  const getSyncStatus = (userId: string) => {
    return getSyncStatusQuery({ userId });
  };

  const getLastSyncTime = (userId: string) => {
    return getLastSyncTimeQuery({ userId });
  };

  return {
    syncUser,
    syncIntegration,
    getSyncStatus,
    getLastSyncTime,
    isSyncing: syncUserMutation.isPending || syncIntegrationMutation.isPending,
  };
};

// Utility function to handle URL parameters (for OAuth callback)
export const getUrlParams = () => {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};

  for (const [key, value] of params) {
    result[key] = value;
  }

  return result;
};

// Utility function to store user data in localStorage
export const userStorage = {
  setUser: (user: { id: string; email: string; name: string | null }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("canvas-sync-user", JSON.stringify(user));
    }
  },

  getUser: (): { id: string; email: string; name: string | null } | null => {
    if (typeof window === "undefined") return null;

    const userData = localStorage.getItem("canvas-sync-user");
    return userData ? JSON.parse(userData) : null;
  },

  removeUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("canvas-sync-user");
    }
  },
};
