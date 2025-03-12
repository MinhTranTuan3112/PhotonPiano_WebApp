import { useMutation } from "@tanstack/react-query";
import { fetchToggleBatchNotificationsStatus } from "~/lib/services/notification";

type Props = {
    idToken: string;
    notificationIds: string[];
};

export function useBatchUpdateNotifications() {
    return useMutation({
        mutationFn: async ({
            idToken,
            notificationIds
        }: Props) => {
            await fetchToggleBatchNotificationsStatus({ notificationIds, idToken });
        }
    })
}