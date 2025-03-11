import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {Subject} from 'rxjs';
import {API_PUB_SUB_URL} from '../utils/constants';

export interface IPubSubMessage {
    topic: string[];
    content: string;
}

class PubSub {
    private static instance: PubSub;
    private hub?: HubConnection;
    private messageSubject = new Subject<IPubSubMessage>();

    private constructor() {
        this.init();
        this.initMessageReceiver();
    }

    public static getInstance(): PubSub {
        if (!PubSub.instance) {
            PubSub.instance = new PubSub();
        }
        return PubSub.instance;
    }

    private init() {
        this.hub = new HubConnectionBuilder()
            .withUrl(API_PUB_SUB_URL, {
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        this.hub.start()
            .then(() => console.info('[Pub Sub] Connection started'))
            .catch((err: unknown) => console.error('[Pub Sub] Error:', err));
    }

    private initMessageReceiver() {
        this.hub?.on("PubSub", (data: unknown) => {
            console.log("[Pub Sub] Received:", data);
            this.messageSubject.next(data as IPubSubMessage);
        });
    }

    receiveMessage() {
        return this.messageSubject.asObservable();
    }
}

export const pubSubService = PubSub.getInstance();