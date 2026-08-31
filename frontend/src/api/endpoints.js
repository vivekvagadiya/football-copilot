// const baseUrl = process.env.BASE_URL || "http://localhost:8000/api/v1";

const endpoints = {
  auth: {
    login: `/auth/login`,
    register: `/auth/register`,
    logout: `/auth/logout`,
    profile: "/auth/me",
    profileUpdate: "/auth/profile",
    profileAvatar: "/auth/profile-avatar",
  },
  conversation: {
    getConversations: "/conversations",
    getConversationDetails: "/conversations/:conversationId",
    startConversation: "/conversations",
    markAsRead: "/conversations/:conversationId/read",
    deleteConversation: "/conversations/:conversationId",
  },
  group: {
    getGroups: "/groups",
    createGroup: "/groups",
    getGroupDetails: "/groups/:groupId",
  },
  messages: {
    getMessages: "/conversations/:conversationId/messages",
    getGroupMessages: "/groups/:groupId/messages",
    sendMessage: "/conversations/:conversationId/messages",
    sendGroupMessage: "/groups/:groupId/messages",
  },
  favorites: {
    toggle: "/favorites/toggle",
    getFavorites: "/favorites",
    getFavoriteIds: "/favorites/ids",
  },
  ai: {
    chat: "/ai/chat",
    recommendations: "/ai/recommendations",
    ragQuery: "/ai/rag/query",
    ragDocuments: "/ai/rag/documents",
    ragDocumentById: (id) => `/ai/rag/documents/${id}`,
    ragIngest: "/ai/rag/ingest",
    conversations: "/ai/conversations",
    conversationById: (id) => `/ai/conversations/${id}`,
    conversationMessages: (id) => `/ai/conversations/${id}/messages`,
  },
  notifications: {
    get: "/notifications",
    markRead: (id) => `/notifications/${id}/read`,
    markAllRead: "/notifications/read-all",
    generate: "/notifications/generate",
  },
};

export default endpoints;
