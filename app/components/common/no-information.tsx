import { Badge } from '../ui/badge'

type Props = {}

export default function NoInformation({ }: Props) {
    return (
        <Badge variant={'outline'} className='text-muted-foreground italic'>No information</Badge>
    )
}