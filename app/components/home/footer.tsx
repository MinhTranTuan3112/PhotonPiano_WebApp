import { Link } from "@remix-run/react";
import { Music } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t bg-white">
            <div className="container py-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Music className="h-6 w-6" />
                            <span className="text-xl font-bold">PianoMaster</span>
                        </div>
                        <p className="text-sm text-gray-600">
                            Nurturing musical talent and passion through excellence in piano education
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Programs</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link to="#" className="hover:text-primary">Private Lessons</Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary">Group Classes</Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary">Performance Program</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Resources</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link to="#" className="hover:text-primary">Student Portal</Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary">Practice Tips</Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary">Sheet Music</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Contact</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>123 Music Street</li>
                            <li>City, State 12345</li>
                            <li>contact@pianomaster.com</li>
                            <li>(555) 123-4567</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-16 border-t pt-8 text-center text-sm text-gray-600">
                    <p>© 2024 PianoMaster. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

