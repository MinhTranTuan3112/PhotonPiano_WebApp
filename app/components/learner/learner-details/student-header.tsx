import { Calendar, Mail, MapPin, Phone, SquareUserRound, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { AccountDetail, Gender } from '~/lib/types/account/account';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';
import AcademicSection from './academic-section';
import NoInformation from '~/components/common/no-information';

type Props = {
    student: AccountDetail;
}

export default function StudentHeader({ student }: Props) {
    return (
        <div className="space-y-6">

            <section className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-neutral-800">
                    <User className="size-5 text-theme" />
                    <h3 className='font-bold'>Basic information</h3>
                </div>

                <Card className='p-3 border-l-4 border-l-theme'>
                    <CardContent className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                                    <AvatarImage
                                        src={student.avatarUrl ? student.avatarUrl : "https://github.com/shadcn.png"}
                                        alt={student.userName || student.fullName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="text-2xl">
                                        {student.fullName
                                            ? student.fullName
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()
                                            : "PP"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                        <div className="flex-1 grid gap-6 w-full">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold">
                                        Full name
                                    </Label>
                                    <p>{student.fullName}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold flex flex-row gap-1 items-center">
                                        <SquareUserRound />
                                        Username
                                    </Label>
                                    <div>{student.userName || <NoInformation />}</div>

                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold flex flex-row gap-1 items-center">
                                        <Mail />
                                        Email
                                    </Label>
                                    <p>{student.email}</p>

                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold flex flex-row gap-1 items-center">
                                        <Phone />
                                        Phone
                                    </Label>
                                    <div>{student.phone || <NoInformation />}</div>

                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold flex flex-row gap-1 items-center">
                                        <Calendar />
                                        Date of birth
                                    </Label>
                                    <div>{student.dateOfBirth ? formatRFC3339ToDisplayableDate(student.dateOfBirth, false) : <NoInformation />}</div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">
                                        Gender:
                                    </Label>
                                    <Badge variant={'outline'} className={`ml-2 ${student.gender === Gender.Male ? 'text-blue-500' : 'text-pink-500'}`}>
                                        {student.gender === Gender.Male ? 'Male' : 'Female'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold flex flex-row gap-1 items-center">
                                    <MapPin />
                                    Address
                                </Label>
                                <div>{student.address || <NoInformation />}</div>

                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">
                                    Short description
                                </Label>
                                <div>{student.shortDescription || <NoInformation />}</div>
                            </div>
                        </div>

                    </CardContent></Card>
            </section>

            <AcademicSection student={student} />

        </div>
    )
}
