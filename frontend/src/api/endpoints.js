// const baseUrl = process.env.BASE_URL || "http://localhost:8000/api/v1";

const endpoints = {
  auth: {
    login: `/auth/login`,
    register: `/auth/register`,
    logout: `/auth/logout`,
    profile:"/auth/me",
    profileUpdate:"/auth/profile",
    profileAvatar:"/auth/profile-avatar"
  },
  conversation:{
    getConversations:"/conversations",
    getConversationDetails:"/conversations/:conversationId",
    startConversation:"/conversations",
    markAsRead:"/conversations/:conversationId/read",
    deleteConversation:"/conversations/:conversationId"
  },
  group:{
    getGroups:"/groups",
    createGroup:"/groups",
    getGroupDetails:"/groups/:groupId"
  },
  messages:{
    getMessages:'/conversations/:conversationId/messages',
    getGroupMessages:'/groups/:groupId/messages',
    sendMessage:'/conversations/:conversationId/messages',
    sendGroupMessage:'/groups/:groupId/messages'
  }
};

export default endpoints;