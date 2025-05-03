import { BookOpen, Calendar, GraduationCap, Mail, MapPin, Phone, SquareUserRound, User } from 'lucide-react';
import { LevelBadge, StatusBadge } from '~/components/staffs/table/student-columns';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { AccountDetail, Gender } from '~/lib/types/account/account';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';

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
                                    <p className="text-xs text-muted-foreground">
                                        This is learner public username.
                                    </p>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold flex flex-row gap-1 items-center">
                                        <Mail />
                                        Email
                                    </Label>
                                    <p>{student.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Use this email to contact learner.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold flex flex-row gap-1 items-center">
                                        <Phone />
                                        Phone
                                    </Label>
                                    <div>{student.phone || <NoInformation />}</div>
                                    <p className="text-xs text-muted-foreground">
                                        This phone number will be used to contact learner when necessary.
                                    </p>
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
                                <p className="text-xs text-muted-foreground">
                                    This address will be used to send important documents to learners if necessary.
                                </p>
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


            <section className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-neutral-800">
                    <BookOpen className="size-5 text-theme" />
                    <h3 className='font-bold'>Academic information</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="bg-muted/40 border-l-4 border-l-theme">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                                <GraduationCap className="mr-2 h-4 w-4" /> Piano Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold">Current</span>
                                <LevelBadge level={student.level} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/40 border-l-4 border-l-theme">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                                <BookOpen className="mr-2 h-4 w-4" /> Academic status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold">Status</span>
                                <StatusBadge status={student.studentStatus || 0} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className='border-l-4 border-l-theme'>
                    <CardHeader>
                        <CardTitle className="text-lg">Continue learning</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    {student.wantToContinue
                                        ? "This learner have registered to continue learning in the next semester."
                                        : "This learner haven't registered to continue learning in the next semester."}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

        </div>
    )
}

function NoInformation() {
    return <Badge variant={'outline'} className='text-muted-foreground italic'>
        No information
    </Badge>
}