import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@remix-run/react";
import { Account } from "~/lib/types/account/account";

type Props = {
    account: Account
}

const ActionDialog = ({ account }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const navigate = useNavigate()
    // Show tooltip 3 seconds after component mounts
    useEffect(() => {
        // Show tooltip after 5 seconds
        const showTimer = setTimeout(() => {
            setShowTooltip(true);

            // Hide tooltip after another 5 seconds
            const hideTimer = setTimeout(() => {
                setShowTooltip(false);
            }, 5000);

            return () => clearTimeout(hideTimer);
        }, 2000);


        return () => clearTimeout(showTimer); // Cleanup on unmount
    }, []);

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {/* Button with Hover Effect */}
            <div
                className="relative flex items-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Tooltip with Animation */}
                <AnimatePresence>
                    {(showTooltip || isHovered) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute left-full ml-4 px-4 py-3 text-white text-lg font-semibold rounded-xl shadow-lg w-96 bg-gradient-to-r from-blue-500 to-blue-700"
                        >
                            Please complete your learning profile setup!
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-700 transform rotate-45"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button onClick={() => setIsOpen(true)}>
                    <img src="/images/grand_piano_1.png" className="w-28 h-28 animate-bounce" />
                </button>
            </div>

            {/* Dialog Component */}
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                transition: { duration: 0.5, ease: "easeOut" }
                            }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative"
                        >
                            <p className="text-xl font-bold text-center">🎶 Let's complete your profile! 🎵</p>
                            <p className="italic text-sm text-center">
                                Please complete the following setup steps so you can get started smoothly!
                            </p>

                            {/* Step Animations */}
                            <div className="my-2 flex flex-col gap-8">
                                {[
                                    { step: 1, text: "Complete your personal profile.", link: "/account/profile" },
                                    { step: 2, text: "Tell us your available study times.", link: "/account/free-slots" },
                                    { step: 3, text: "Track your entrance exam date.", link: "/account/my-exams" }
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.step}
                                        className="flex gap-2 items-center"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 * (index + 1), duration: 0.4, ease: "easeOut" }}
                                    >
                                        {
                                            (index !== 3 || (index === 3 && account.studentStatus === 1)) && (
                                                <>
                                                    <div className="mb-1 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-black text-white">
                                                        {item.step}
                                                    </div>
                                                    <span>
                                                        {item.text}{" "}
                                                        <Button className="font-bold" variant={'link'} onClick={() => navigate(item.link)}>
                                                            Let's go!
                                                        </Button>
                                                    </span>
                                                </>
                                            )
                                        }
                                    </motion.div>
                                ))}
                            </div>

                            {/* Close Button with a Little "Bounce" */}
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="mt-4 text-center"
                            >
                                <Button onClick={() => setIsOpen(false)}>Close 🎵</Button>
                            </motion.div>
                        </motion.div>
                    </DialogContent>
                </Dialog>
            )}
        </div>

    );
};

export default ActionDialog;
