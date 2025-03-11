import { HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { QueryPagedRequest } from '../types/query/query-paged-request';
import axiosInstance from '../utils/axios-instance';
import { API_PROGRESS_URL } from '../utils/constants';

export interface IProgressMessage {
    progress: number;
    message: string;
}

export class ProgressService {
    private hub?: HubConnection;
    private messageSubject: Subject<IProgressMessage>;

    constructor(firebaseId: string) {
        this.messageSubject = new Subject<IProgressMessage>();
        this.init(firebaseId);
        this.initMessageReceiver();
    }

    private init(firebaseId: string) {
        this.hub = new HubConnectionBuilder()
            .withUrl(`${API_PROGRESS_URL}?firebaseId=${firebaseId}`, {
                skipNegotiation: true,
                transport: HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        this.hub
            .start()
            .then(() => {
                console.info('[Progress] Connection started');
            })
            .catch((err: any) => console.error('[Progress] Error while starting connection: ' + err));
    }

    private initMessageReceiver() {
        this.hub?.on("ReceiveProgress", (data: IProgressMessage) => {
            console.log("[Progress] Received message:", data);
            this.messageSubject.next(data);
        });
    }

    receiveMessage() {
        return this.messageSubject.asObservable();
    }
}
