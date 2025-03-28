export type Notification = {
    id: string;
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string;
    content: string;
    thumbnail: string;
};

export type AccountNotification = {
    id: string;
    accountFirebaseId: string;
    notificationId: string;
    isViewed: boolean;
};

export type NotificationDetails = {
    accountNotifications: AccountNotification[];
} & Notification;