import { HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { API_NOTIFICATION_URL } from '../utils/constants';

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