import { HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useRouteLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_SCORE_URL } from "~/lib/utils/constants";
import { loader } from "~/root";

interface ScorePublishedData {
    classId: string;
    className: string;
    isPassed: boolean;
}

const ScoreNotificationModal: React.FC = () => {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [notificationData, setNotificationData] = useState<ScorePublishedData | null>(null);
    const authData = useRouteLoaderData<typeof loader>("root");

    useEffect(() => {
        console.log('[Score Hub] useEffect triggered');

        const firebaseId = authData.currentAccountFirebaseId;
        console.log('[Score Hub] Firebase ID:', firebaseId);

        if (!firebaseId) {
            console.error('[Score Hub] Firebase ID not available');
            return;
        }

        const hubConnection = new HubConnectionBuilder()
            .withUrl(`${API_SCORE_URL}?firebaseId=${firebaseId}`, {
                skipNegotiation: true,
                transport: HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Error)
            .build();

        console.log('[Score Hub] Hub connection created');

        hubConnection.start()
            .then(() => {
                console.info('[Score Hub] Connection started');
                setConnection(hubConnection);
            })
            .catch((err) => console.error('[Score Hub] Error while starting connection:', err));

        hubConnection.on('ScorePublished', (data: ScorePublishedData) => {
            console.log('[Score Hub] ScorePublished event received:', data);
            setNotificationData(data);
            setShowModal(true);
        });

        return () => {
            console.log('[Score Hub] Cleaning up connection');
            if (hubConnection) {
                hubConnection.stop().then(() => {
                    console.log('[Score Hub] Connection stopped');
                }).catch(err => {
                    console.error('[Score Hub] Error stopping connection:', err);
                });
            }
        };
    }, [authData.currentAccountFirebaseId]);

    const closeModal = () => {
        console.log('[Score Hub] Modal closed');
        setShowModal(false);
    };

    if (!showModal || !notificationData) {
        return null;
    }

    console.log('[Score Hub] Showing modal with data:', notificationData);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
                <div className="flex items-center mb-4">
                    <div className={`rounded-full p-2 mr-3 ${notificationData.isPassed ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        {notificationData.isPassed ? (
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        )}
                    </div>
                    <h2 className="text-xl font-semibold">
                        {notificationData.isPassed ? 'Congratulations!' : 'Class Completed'}
                    </h2>
                </div>

                <div className="mb-6">
                    <p className="text-gray-700 mb-3">
                        Your scores for <span className="font-medium">{notificationData.className}</span> have been published.
                    </p>
                    {notificationData.isPassed ? (
                        <p className="text-gray-700">
                            You have successfully passed this class and have been moved to the next level.
                        </p>
                    ) : (
                        <p className="text-gray-700">
                            You need to work harder in your next class. You are waiting for new class placement.
                        </p>
                    )}
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export const showScorePublishedToast = (data: ScorePublishedData) => {
    const message = data.isPassed
        ? `Congratulations! You've passed ${data.className}.`
        : `Class ${data.className} has ended. View your scores.`;

    console.log('[Score Hub] Showing toast message:', message);

    toast.info(message, {
        position: "top-right",
        duration: 5000,
    });
};

export default ScoreNotificationModal;
