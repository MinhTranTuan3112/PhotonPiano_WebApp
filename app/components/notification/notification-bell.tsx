
import { Bell, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { fetchNotifications, INotificationMessage, NotificationService } from "~/lib/services/notification";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { QueryPagedRequest } from "~/lib/types/query/query-paged-request";
import { PaginationMetaData } from "~/lib/types/pagination-meta-data";
import { useFetcher, useRouteLoaderData } from "@remix-run/react";
import { NotificationDetails } from "~/lib/types/notification/notification";
import { loader } from "~/root";
import { action } from "~/routes/notification";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { timeAgo } from "~/lib/utils/datetime";
import { useBatchUpdateNotifications } from "~/hooks/use-update-batch-notifications";


const initialNotifications = [
    {
        id: 1,
        user: "Chris Tompson",
        action: "requested review on",
        target: "PR #42: Feature implementation",
        timestamp: "15 minutes ago",
        unread: true,
    },
    {
        id: 2,
        user: "Emma Davis",
        action: "shared",
        target: "New component library",
        timestamp: "45 minutes ago",
        unread: true,
    },
    {
        id: 3,
        user: "James Wilson",
        action: "assigned you to",
        target: "API integration task",
        timestamp: "4 hours ago",
        unread: false,
    },
    {
        id: 4,
        user: "Alex Morgan",
        action: "replied to your comment in",
        target: "Authentication flow",
        timestamp: "12 hours ago",
        unread: false,
    },
    {
        id: 5,
        user: "Sarah Chen",
        action: "commented on",
        target: "Dashboard redesign",
        timestamp: "2 days ago",
        unread: false,
    },
    {
        id: 6,
        user: "Miky Derya",
        action: "mentioned you in",
        target: "Origin UI open graph image",
        timestamp: "2 weeks ago",
        unread: false,
    },
];


function Dot({ className }: { className?: string }) {
    return (
        <svg
            width="6"
            height="6"
            fill="currentColor"
            viewBox="0 0 6 6"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <circle cx="3" cy="3" r="3" />
        </svg>
    );
}

async function fetchNoti(query: Partial<QueryPagedRequest & { isViewed: boolean }> & { idToken: string }) {
    const response = await fetchNotifications({ ...query });

    const headers = response.headers;

    const metadata: PaginationMetaData = {
        page: parseInt(headers['x-page'] || '1'),
        pageSize: parseInt(headers['x-page-size'] || '10'),
        totalPages: parseInt(headers['x-total-pages'] || '1'),
        totalCount: parseInt(headers['x-total-count'] || '0'),
    };

    return {
        data: response.data,
        metadata
    }
}

export default function NotificationBell({ accountFirebaseId }: { accountFirebaseId: string }) {

    const authData = useRouteLoaderData<typeof loader>("root");
    const fetcher = useFetcher<typeof action>();

    const [isViewed, setIsViewed] = useState<boolean | undefined>(undefined);

    const queryKey = ['notifications', accountFirebaseId, isViewed];

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: queryKey,
            queryFn: ({ pageParam = 1 }) =>
                fetchNoti({
                    page: pageParam, pageSize: 5, sortColumn: 'CreatedAt', orderByDesc: true, idToken: authData?.idToken || '',
                    isViewed
                }),
            getNextPageParam: (lastResult) =>
                lastResult.metadata?.page < lastResult.metadata?.totalPages ? lastResult.metadata?.page + 1 : undefined,
            enabled: true, // Automatically fetch when the component is mounted
            initialPageParam: 1,
            refetchOnWindowFocus: false,
        });


    const queryClient = useQueryClient();

    const fetchedNotifications: NotificationDetails[] = data?.pages.flatMap(item => item.data) || [];

    const { mutate: markAllRead, isPending: isMarkingAllRead } = useBatchUpdateNotifications();
    
    const unreadCount = fetchedNotifications.filter((n) => n.accountNotifications.find(an => an.accountFirebaseId == accountFirebaseId)?.isViewed === false).length;

    useEffect(() => {
        if (!accountFirebaseId) {
            console.error("accountFirebaseId is undefined");
            return;
        }

        // ]);
        console.log("accountFirebaseId", accountFirebaseId);

        const notificationService = new NotificationService(accountFirebaseId);
        console.log("notificationService", notificationService);
        const subscription = notificationService.receiveMessage().subscribe((notification: INotificationMessage) => {
            console.log("received notification", notification);
            queryClient.invalidateQueries({
                queryKey
            });
            // setNotifications((prevNotifications) => [
            //     { id: Date.now(), user: "System", action: "sent you a notification", target: notification.message, timestamp: "just now", unread: true },
            //     ...prevNotifications,
        });

        return () => {
            subscription.unsubscribe();
        };

    }, [accountFirebaseId]);

    const handleMarkAllAsRead = useCallback((idToken: string, notificationIds: string[]) => {
        markAllRead({ idToken, notificationIds }, {
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey
                });
            }
        });
    }, []);

    const handleNotificationClick = useCallback((id: string) => {

        fetcher.submit({ id }, {
            action: '/notification',
            method: 'POST',
            flushSync: true,
        });

    }, []);

    useEffect(() => {

        if (fetcher.data?.success === true) {
            queryClient.invalidateQueries({
                queryKey
            });
            return;
        }

        if (fetcher.data?.success === false && fetcher.data?.error) {
            toast.error(fetcher.data?.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop === target.clientHeight && hasNextPage) {
            fetchNextPage();
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" size="icon" variant="outline" className="relative" aria-label="Open notifications">
                    <Bell size={16} strokeWidth={2} aria-hidden="true" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-2 left-full -translate-x-1/2 rounded-full">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1" >
                <div className="flex items-baseline justify-between gap-4 px-3 py-2">
                    <div className="text-sm font-semibold">Thông báo</div>
                    {unreadCount > 0 && (
                        <button type="button" className="text-xs font-medium hover:underline" onClick={() => {
                            const notificationIds = fetchedNotifications.map(n => n.id);

                            handleMarkAllAsRead(authData?.idToken || '', notificationIds);
                        }}
                            disabled={fetcher.state === 'submitting' || isLoading || isFetchingNextPage}>
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>
                <div className="flex flex-row gap-2 px-3">
                    <Button type="button" variant={isViewed === undefined ? 'default' : 'outline'}
                        size={'sm'}
                        onClick={() => setIsViewed(undefined)}>
                        Tất cả
                    </Button>
                    <Button type="button" variant={isViewed === false ? 'default' : 'outline'}
                        onClick={() => setIsViewed(false)}
                        size={'sm'}>
                        Chưa đọc
                    </Button>
                </div>
                <div
                    role="separator"
                    aria-orientation="horizontal"
                    className="-mx-1 my-1 h-px bg-border"
                ></div>
                <ScrollArea className="max-h-[300px] overflow-y-auto" onScroll={handleScroll}>
                    {fetchedNotifications.length > 0 ? fetchedNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                        >
                            <div className="relative flex items-start pe-3">
                                <div className="flex-1 space-y-1">
                                    <button
                                        className="text-left text-foreground/80 after:absolute after:inset-0"
                                        onClick={() => handleNotificationClick(notification.id)}
                                        type="button"
                                    >
                                        <span className="font-medium text-foreground hover:underline">
                                            {notification.content}
                                        </span>
                                        {/* <span className="font-medium text-foreground hover:underline">
                                            {notification.user}
                                        </span>{" "}
                                        {notification.action}{" "}
                                        <span className="font-medium text-foreground hover:underline">
                                            {notification.target}
                                        </span>
                                        . */}
                                    </button>
                                    <div className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</div>
                                </div>
                                {notification.accountNotifications.find(an => an.accountFirebaseId == accountFirebaseId)?.isViewed === false && (
                                    <div className="absolute end-0 self-center">
                                        <span className="sr-only">Unread</span>
                                        <Dot />
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="px-3 py-2 text-sm text-center text-muted-foreground">
                            Không có thông báo mới
                        </div>
                    )}
                </ScrollArea>

                {isLoading || isFetchingNextPage && (
                    <Loader2 className="animate-spin" />
                )}
            </PopoverContent>
        </Popover>
    );
}

