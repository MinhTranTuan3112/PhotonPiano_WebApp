import { useState } from "react"
import { Music, Piano } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Checkbox } from "../ui/checkbox"

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    onAccept?: () => void
}

export function TermsDialog({ open, setOpen, onAccept }: Props) {

    const [accepted, setAccepted] = useState(false)

    const handleAccept = () => {
        if (accepted && onAccept) {
            onAccept()
        }
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-center space-x-3">
                        <Piano className="h-6 w-6" />
                        <DialogTitle className="text-2xl">Terms & Conditions</DialogTitle>
                    </div>
                    <DialogDescription>
                        Please read these terms and conditions carefully before enrolling in our piano lessons.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">Last Updated: April 26, 2025</p>

                    <div className="space-y-4">
                        <p className="text-sm">
                            Welcome to Photon Piano Education Center. These Terms and Conditions govern your use of our services,
                            including piano lessons, recitals, workshops, and other educational activities offered by our center.
                        </p>
                        <p className="text-sm">
                            By enrolling in our programs or using our facilities, you agree to be bound by these Terms and Conditions.
                            If you do not agree with any part of these terms, please do not proceed with enrollment.
                        </p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="enrollment">
                            <AccordionTrigger className="text-base font-medium">1. Enrollment and Registration</AccordionTrigger>
                            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                                <p>1.1 All students must complete a registration form before commencing lessons.</p>
                                <p>
                                    1.2 For students under 18 years of age, a parent or legal guardian must complete the registration
                                    process.
                                </p>
                                <p>1.3 Registration is confirmed upon payment of the registration fee and first month's tuition.</p>
                                <p>1.4 By registering, you confirm that all information provided is accurate and complete.</p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="tuition">
                            <AccordionTrigger className="text-base font-medium">2. Tuition and Payment</AccordionTrigger>
                            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                                <p>2.1 Tuition is due on the 1st of each month for that month's lessons.</p>
                                <p>2.2 A late fee of $15 will be applied to payments received after the 5th of the month.</p>
                                <p>2.3 Tuition rates are subject to annual review and may be adjusted with 30 days' notice.</p>
                                <p>
                                    2.4 Tuition covers lessons only. Additional materials, books, and participation in recitals may incur
                                    separate fees.
                                </p>
                                <p>
                                    2.5 We accept payments via credit card, bank transfer, or check. Cash payments must be handed directly
                                    to the administrative staff.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="attendance">
                            <AccordionTrigger className="text-base font-medium">3. Attendance and Cancellations</AccordionTrigger>
                            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                                <p>3.1 Regular attendance is expected for optimal progress.</p>
                                <p>3.2 Lessons missed by students without 24-hour notice will not be refunded or rescheduled.</p>
                                <p>3.3 Students are entitled to reschedule up to 3 lessons per semester with 24-hour advance notice.</p>
                                <p>
                                    3.4 If an instructor cancels a lesson, it will be rescheduled or credited to the following month's
                                    tuition.
                                </p>
                                <p>
                                    3.5 In case of inclement weather, lessons may be conducted online. Notification will be sent via email
                                    and text.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="conduct">
                            <AccordionTrigger className="text-base font-medium">
                                4. Student Conduct and Practice Expectations
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                                <p>4.1 Students are expected to arrive on time with all required materials.</p>
                                <p>
                                    4.2 Regular practice between lessons is essential for progress. Instructors will provide recommended
                                    practice schedules.
                                </p>
                                <p>4.3 Students must treat the facility, instruments, and staff with respect.</p>
                                <p>4.4 Disruptive behavior may result in dismissal from the program without refund.</p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="termination">
                            <AccordionTrigger className="text-base font-medium">5. Termination of Services</AccordionTrigger>
                            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                                <p>5.1 To discontinue lessons, written notice must be provided 30 days in advance.</p>
                                <p>
                                    5.2 Photon Piano Education Center reserves the right to terminate lessons for students who
                                    consistently violate these terms.
                                </p>
                                <p>
                                    5.3 No refunds will be issued for lessons remaining in a prepaid period after termination by the
                                    student.
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="liability">
                            <AccordionTrigger className="text-base font-medium">6. Liability and Media Release</AccordionTrigger>
                            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    6.1 Photon Piano Education Center is not responsible for personal injuries or property damage
                                    occurring on our premises.
                                </p>
                                <p>
                                    6.2 By enrolling, you grant permission for the center to use photographs and recordings of students in
                                    promotional materials.
                                </p>
                                <p>6.3 If you wish to opt out of media usage, please submit a written request to the administration.</p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="modifications">
                            <AccordionTrigger className="text-base font-medium">7. Modifications to Terms</AccordionTrigger>
                            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                                <p>7.1 Photon Piano Education Center reserves the right to modify these terms at any time.</p>
                                <p>7.2 Changes will be communicated via email and posted on our website.</p>
                                <p>7.3 Continued enrollment after modifications constitutes acceptance of the updated terms.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <div className="mt-2 flex items-center space-x-2">
                    <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} />
                    <label
                        htmlFor="terms"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        I have read and agree to the terms and conditions
                    </label>
                </div>

                <DialogFooter className="flex flex-col space-y-4 sm:space-y-0">
                    <Button onClick={handleAccept} disabled={!accepted} className="w-full sm:w-auto">
                        Accept Terms & Conditions
                    </Button>
                </DialogFooter>

                <div className="mt-4 flex flex-col items-center justify-center space-y-2 text-center">
                    <Music className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold">Photon Piano Education Center</p>
                        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} All rights reserved.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export function useTermsDialog({
    onAccept
}: {
    onAccept?: () => void
}) {
    const [isOpen, setIsOpen] = useState(false);

    const termsDialog = (<TermsDialog open={isOpen} setOpen={setIsOpen}
        onAccept={onAccept} />)

    return {
        termsDialog,
        openTermsDialog: () => setIsOpen(true),
    }
}