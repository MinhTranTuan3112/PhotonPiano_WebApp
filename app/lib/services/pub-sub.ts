import {HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {Subject} from 'rxjs';
import {API_PUB_SUB_URL} from '../utils/constants';

export interface IPubSubMessage {
    topic: string[];
    content: string;
}

export class PubSub {
    private hub?: HubConnection;
    private messageSubject: Subject<IPubSubMessage>;

    constructor() {
        this.messageSubject = new Subject<IPubSubMessage>();
        this.init();
        this.initMessageReceiver();
    }

    private init() {
        this.hub = new HubConnectionBuilder()
            .withUrl(API_PUB_SUB_URL , {
                skipNegotiation : true,
                transport: HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        this.hub
            .start()
            .then(() => {
                console.info('[Pub Sub] Connection started');
            })
            .catch((err: unknown) => console.error('[Pub Sub] Error while starting connection: ' + err));
    }

    private initMessageReceiver() {
        this.hub?.on("PubSub", (data: unknown) => {
            console.log("[Pub Sub] Received message:", data);
            this.messageSubject.next(data as IPubSubMessage);
        });
    }


    receiveMessage() {
        return this.messageSubject.asObservable();
    }
}