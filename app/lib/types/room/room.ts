export type Room = {
    id : string,
    name : string,
    capacity : number,
    status : number // 0 = inactive, 1 = active
};

export const sampleRooms : Room[] = [
    {
        id: "1",
        name: "Conference Room A",
        capacity: 10,
        status: 1
    },
    {
        id: "2",
        name: "Meeting Room B",
        capacity: 8,
        status: 1
    },
    {
        id: "3",
        name: "Training Room C",
        capacity: 25,
        status: 0
    },
    {
        id: "4",
        name: "Board Room D",
        capacity: 15,
        status: 1
    },
    {
        id: "5",
        name: "Breakout Room E",
        capacity: 5,
        status: 0
    }
];