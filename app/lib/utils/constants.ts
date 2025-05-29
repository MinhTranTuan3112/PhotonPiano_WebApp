export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string || 'https://photonpiano.api:5001';

export const TEST_IMAGE_GROUP_ID = "0193c810-67b1-7c4e-b2e2-fe13de074627";

export const PAYMENT_STATUSES = ["Not Paid", "Paid", "Failed", "Cancelled"];

export const SHIFT_TIME = [
  "7:00 - 8:30",
  "8:45 - 10:15",
  "10:30 - 12:00",
  "12:30 - 14:00",
  "14:15 - 15:45",
  "16:00 - 17:30",
  "18:00 - 19:30",
  "19:45 - 21:45",
];

export const ENTRANCE_TEST_STATUSES = [
  "Not started",
  "On going",
  "Ended",
  "Disabled",
];

export const LEVEL = ["Người mới học", "Nghiệp dư", "Trung cấp", "Cao cấp", "Bậc thầy"];

export const STUDENT_STATUS = ["Unregistered", "Waiting for entrance tests", "Attempting entrance test", "Waiting for class",
  "Learning", "Drop Out", "Left"];

export const CLASS_STATUS = ["Not Started", "On Going", "Finished", "Disabled"];

export const SLOT_STATUS = ["Not Started", "On Going", "Finished", "Disabled"];

export const ATTENDANCE_STATUS = ["Not Yet", "Attended", "Absent"];

export const API_PUB_SUB_URL = import.meta.env.VITE_API_PUB_SUB_URL as string;

export const APPLICATION_TYPE = ["Leave of absence", "Temporary suspension of term", "Re-examine entrance scores", "Re-examine final exam scores",
  "Class transfer", "Teacher complaint", "Service complaint", "Refund tuition", "Other", "Certificate issue report"];

export const APPLICATION_STATUS = ["Pending", "Approved", "Rejected", "Cancelled"];

export const API_NOTIFICATION_URL = import.meta.env.VITE_API_NOTIFICATION_URL as string;

export const API_PROGRESS_URL = import.meta.env.VITE_API_PROGRESS_URL as string;

export const API_SCORE_URL = import.meta.env.VITE_API_SCORE_URL as string;

export const QUESTION_TYPES = ["Single Choice Question", "Multiple Choice Question", "Text Input Question", "Rate Question", "Number question"];

export const ROOM_STATUS = ["Available", "Unavailable"];

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const TUITION_STATUS = ["Fully Paid","In Debt","No tuition"];