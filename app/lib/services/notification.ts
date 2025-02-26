import { HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { API_NOTIFICATION_URL } from '../utils/constants';
import { QueryPagedRequest } from '../types/query/query-paged-request';
import axiosInstance from '../utils/axios-instance';

export interface INotificationMessage {
    title: string;
    message: string;
}

export class NotificationService {
    private hub?: HubConnection;
    private messageSubject: Subject<INotificationMessage>;

    constructor(firebaseId: string) {
        this.messageSubject = new Subject<INotificationMessage>();
        this.init(firebaseId);
        this.initMessageReceiver();
    }

    private init(firebaseId: string) {
        this.hub = new HubConnectionBuilder()
            .withUrl(`${API_NOTIFICATION_URL}?firebaseId=${firebaseId}`, {
                skipNegotiation: true,
                transport: HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        this.hub
            .start()
            .then(() => {
                console.info('[Notification] Connection started');
            })
            .catch((err: any) => console.error('[Notification] Error while starting connection: ' + err));
    }

    private initMessageReceiver() {
        this.hub?.on("ReceiveNotification", (data: INotificationMessage) => {
            console.log("[Notification] Received message:", data);
            this.messageSubject.next(data);
        });
    }

    receiveMessage() {
        return this.messageSubject.asObservable();
    }
}

export async function fetchNotifications({
    page = 1,
    pageSize = 10,
    sortColumn = 'Id',
    orderByDesc = true,
    isViewed,
    idToken
}: Partial<QueryPagedRequest & {
    isViewed: boolean
}> & {
    idToken: string
}) {
    let url = `/notifications?page=${page}&size=${pageSize}&column=${sortColumn}&desc=${orderByDesc}`;

    if (isViewed) {
        url += `&view=${isViewed}`;
    }

    const response = await axiosInstance.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function toggleNotificationStatus({
    id, idToken
}: {
    id: string,
    idToken: string
}) {

    const response = await axiosInstance.put(`/notifications/${id}/view-status`, null, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}

export async function fetchToggleBatchNotificationsStatus({
    notificationIds,
    idToken
}: {
    notificationIds: string[],
    idToken: string
}) {

    const response = await axiosInstance.put(`/notifications/view-status`, { notificationIds }, {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    });

    return response;
}