export const currentTeacher = {
  id: 1,
  name: "Test Teacher",
};

export let role = "teacher";
export const classesData = [
  {
    id: 1,
    name: "1A",
    capacity: 20,
    location: "Room 101",
    time: "Monday, 9:00 AM - 10:30 AM",
    teacherId: 1,
  },
  {
    id: 2,
    name: "2B",
    capacity: 22,
    location: "Room 102",
    time: "Tuesday, 11:00 AM - 12:30 PM",
    teacherId: 2,
  },
  {
    id: 3,
    name: "3C",
    capacity: 20,
    location: "Room 103",
    time: "Wednesday, 2:00 PM - 3:30 PM",
    teacherId: 1,
  },
  {
    id: 4,
    name: "4B",
    capacity: 18,
    location: "Room 104",
    time: "Thursday, 10:00 AM - 11:30 AM",
    teacherId: 3,
  },
  {
    id: 5,
    name: "5A",
    capacity: 16,
    location: "Room 105",
    time: "Friday, 1:00 PM - 2:30 PM",
    teacherId: 1,
  },
  {
    id: 6,
    name: "5B",
    capacity: 20,
    location: "Room 106",
    time: "Monday, 3:00 PM - 4:30 PM",
    teacherId: 4,
  },
  {
    id: 7,
    name: "7A",
    capacity: 18,
    location: "Room 107",
    time: "Tuesday, 9:00 AM - 10:30 AM",
    teacherId: 5,
  },
  {
    id: 8,
    name: "6B",
    capacity: 22,
    location: "Room 108",
    time: "Wednesday, 11:00 AM - 12:30 PM",
    teacherId: 6,
  },
  {
    id: 9,
    name: "6C",
    capacity: 18,
    location: "Room 109",
    time: "Thursday, 2:00 PM - 3:30 PM",
    teacherId: 7,
  },
  {
    id: 10,
    name: "6D",
    capacity: 20,
    location: "Room 110",
    time: "Friday, 10:00 AM - 11:30 AM",
    teacherId: 1,
  },
];

// Filter classes for the current teacher
export const teacherClasses = classesData.filter(
  (cls) => cls.teacherId === currentTeacher.id
);

// Mock student data
export const studentsData = [
  { id: 1, name: "Alice Johnson", grade: "A", classId: 1 },
  { id: 2, name: "Bob Smith", grade: "B", classId: 1 },
  { id: 3, name: "Charlie Brown", grade: "A-", classId: 1 },
  { id: 4, name: "Diana Ross", grade: "B+", classId: 1 },
  { id: 5, name: "Ethan Hunt", grade: "A+", classId: 1 },
  { id: 6, name: "Fiona Apple", grade: "B-", classId: 3 },
  { id: 7, name: "George Michael", grade: "A", classId: 3 },
  { id: 8, name: "Hannah Montana", grade: "B+", classId: 3 },
  { id: 9, name: "Ian McKellen", grade: "A-", classId: 3 },
  { id: 10, name: "Julia Roberts", grade: "B", classId: 3 },
  { id: 11, name: "Kevin Bacon", grade: "A", classId: 5 },
  { id: 12, name: "Lana Del Rey", grade: "B+", classId: 5 },
  { id: 13, name: "Michael Jordan", grade: "A+", classId: 5 },
  { id: 14, name: "Natalie Portman", grade: "A-", classId: 5 },
  { id: 15, name: "Orlando Bloom", grade: "B", classId: 5 },
  { id: 16, name: "Penelope Cruz", grade: "A", classId: 10 },
  { id: 17, name: "Quentin Tarantino", grade: "B+", classId: 10 },
  { id: 18, name: "Rachel Green", grade: "B", classId: 10 },
  { id: 19, name: "Samuel L. Jackson", grade: "A-", classId: 10 },
  { id: 20, name: "Tina Turner", grade: "A+", classId: 10 },
];
